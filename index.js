import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { Client, Collection, Events, GatewayIntentBits, MessageFlags, Partials, ActivityType } from 'discord.js';
import config from './helpers/config.json' with { type: "json" };
const { token } = config;
const { ownerId } = config;
const { topggAPIKey } = config;
import { scheduleDailyReminders } from './helpers/schedulers.js';
import { Sequelize, Op } from 'sequelize';
import { AutoPoster } from "topgg-autoposter";
const sequelize = new Sequelize({
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'jeff.sqlite',
});
import { Api } from "@top-gg/sdk";
const TopggAPI = new Api(topggAPIKey);

import jeffFactory from './models/jeff.js';
import rivalsDataFactory from './models/rivalsdata.js';
import itemsFactory from './models/items.js';
import inventoryFactory from './models/inventory.js';
import equipmentFactory from './models/equipment.js';
import petsFactory from './models/pets.js';
import { getUserAndUpdate, updateItemShop, getNapEnergy } from './helpers/utils.js';

const jeff = jeffFactory(sequelize, Sequelize.DataTypes);
const rivalsData = rivalsDataFactory(sequelize, Sequelize.DataTypes);
const items = itemsFactory(sequelize, Sequelize.DataTypes);
const inventory = inventoryFactory(sequelize, Sequelize.DataTypes);
const equipment = equipmentFactory(sequelize, Sequelize.DataTypes);
const pets = petsFactory(sequelize, Sequelize.DataTypes);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages, // allow DMs
        GatewayIntentBits.MessageContent, // allow reading DM content
    ],
    partials: [Partials.Channel], // needed so DM channels work
});
// for napping
const wakeUpCommands = ["bubble", "daily", "fish", "gift", "trader", "spit", "use", "nom", "play", "quiz"];

export default client;

client.commands = new Collection();
client.cooldowns = new Collection();
client.itemCache = null; // when database synced this will become a local cache for the items db
client.napping = new Collection();
client.wakeCommands = wakeUpCommands;
client.db = { jeff, rivalsData, items, inventory, equipment, pets };
const foldersPath = join(__dirname, 'commands');
const commandFolders = readdirSync(foldersPath);



// Runs on initialization, grabs all commands in commands folder
for (const folder of commandFolders) {
    const commandsPath = join(foldersPath, folder);
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        const fileUrl = pathToFileURL(filePath).href;
        const commandImport = await import(fileUrl);
        const command = commandImport.default || commandImport;
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
        else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Sets ready state for Jeff Bot
client.once(Events.ClientReady, readyClient => {
    client.user.setActivity('Waiting for /jeff', { type: ActivityType.Custom });
    scheduleDailyReminders(client, client.db.jeff);
    // TODO: move all init before this log
    console.log(`Ready! Logged in as ${readyClient.user.tag} at ${new Date().toLocaleTimeString()}`);
});

// Main command handling function
client.on(Events.InteractionCreate, async interaction => {
    // checks if slash command is slash command and exists
    if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    if (interaction.isAutocomplete()) {
        try {
            await command.autocomplete(interaction);
        } catch (error) {
            console.error(error);
        }
    } else {
        // cooldown handling
        const { cooldowns } = interaction.client;

        if (!cooldowns.has(command.data.name)) {
            cooldowns.set(command.data.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.data.name);
        const defaultCooldownDuration = 1;
        const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

            if (now < expirationTime) {
                const expiredTimestamp = Math.round(expirationTime / 1000);
                switch (command.data.name) {
                    case "fish":
                        return interaction.reply({ content: `You're scaring the fish away! You can cast your line again <t:${expiredTimestamp}:R>.`, flags: MessageFlags.Ephemeral });
                    case "nom":
                        return interaction.reply({ content: `Jeff's tummy is way too full! He'll be hungry enough to nom someone else <t:${expiredTimestamp}:R>.`, flags: MessageFlags.Ephemeral });
                    case "spit":
                        return interaction.reply({ content: `Jeff's out of ammo! He'll be able to spit again <t:${expiredTimestamp}:R>.`, flags: MessageFlags.Ephemeral });
                    case "bubble":
                        return interaction.reply({ content: `Jeff is all out of bubbles! He'll be ready again <t:${expiredTimestamp}:R>.`, flags: MessageFlags.Ephemeral });
                    default:
                        return interaction.reply({ content: `Jeff got distracted by some food, he can't help you right now... \`${command.data.name}\` will be ready again <t:${expiredTimestamp}:R>.`, flags: MessageFlags.Ephemeral });
                }
            }
        }
        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

        // runs command according to command file with error handling
        try {
            await command.execute(interaction);
            // handle napping
            if (wakeUpCommands.includes(interaction.commandName) && client.napping.has(interaction.user.id)) {
                const now = Date.now();
                const user = await getUserAndUpdate(client.db.jeff, interaction.user.id, interaction.member?.displayName || interaction.user.displayName, false);
                const time = now - interaction.client.napping.get(interaction.user.id);
                const napEnergy = getNapEnergy(interaction.client.napping.get(interaction.user.id));
                user.napping = null;
                user.energy += napEnergy;
                await user.save();
                client.napping.delete(interaction.user.id);
                await interaction.followUp({ content: `You woke Jeff up from his nap! He slept for around ${(time / (1000 * 3600)).toFixed(2)} hours. ${(napEnergy === 0) ? `You didn't earn any energy...let Jeff sleep longer!` : `You earned ${napEnergy} energy for letting him rest!`}`, flags: MessageFlags.Ephemeral });
                console.log(`${interaction.user.username} (${interaction.user.id}) woke up Jeff after ${(time / (1000 * 3600)).toFixed(2)} hours to get ${napEnergy} energy.`);
            }
            if (interaction.guild) {
                console.log(`Commands were run in ${interaction.guild.name}.`);
            } else {
                console.log(`Commands were run in DMs.`);
            }
        }
        catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Something unexpected happened while interacting with this command. -- please report this error --', flags: MessageFlags.Ephemeral });
            }
            else {
                await interaction.reply({ content: 'There was an error while executing this command! -- please report this error --', flags: MessageFlags.Ephemeral });
            }
        }
    }
});

// DM control and vote reading
// !dm [userID] [y/n/e] [msg]
// !info [userID] [info]
client.on(Events.MessageCreate, async message => {
    if (message.channel.id == "1472856269059784848" && message.content.startsWith("TECHNO")) { // surely it's ok if this is public
        await handleVote(message);
    } else if (message.author.id === ownerId && message.channel.type === 1) { // channel type 1 = DM channel
        // !dm control
        if (message.content.startsWith('!dm')) {
            await handleJeffDonation(message);
            // !info control
        } else if (message.content.startsWith('!info')) {
            await handleInfo(message);
            // !getinfo control
        } else if (message.content.startsWith('!getinfo')) {
            const [cmd, userId] = message.content.split(' ');
            const user = await client.db.jeff.findByPk(userId);
            await message.reply(JSON.stringify(user, null, 1));
        }
    }
});

AutoPoster(topggAPIKey, client).on("posted", (stats) => {
    console.log(`[AutoPoster] Posted stats to Top.gg (${stats.serverCount} servers)!`);
});

(async () => {
    // one user can be in many inventory rows, and one inventory row maps to one user
    jeff.hasMany(inventory, {
        foreignKey: 'userid',
        sourceKey: 'userid'
    });
    inventory.belongsTo(jeff, {
        foreignKey: 'userid',
        targetKey: 'userid'
    });
    // one item can be in many inventory rows, and one inventory row maps to one item
    items.hasMany(inventory, {
        foreignKey: 'itemid',
        sourceKey: 'itemid'
    });
    inventory.belongsTo(items, {
        foreignKey: 'itemid',
        targetKey: 'itemid'
    });
    // one user can be in many equipment rows, and one equipment row maps to one user
    jeff.hasMany(equipment, {
        foreignKey: 'userid',
        sourceKey: 'userid'
    });
    equipment.belongsTo(jeff, {
        foreignKey: 'userid',
        targetKey: 'userid'
    });
    // one item can be in many equipment rows, and one equipment row maps to one item
    items.hasMany(equipment, {
        foreignKey: 'itemid',
        sourceKey: 'itemid'
    });
    equipment.belongsTo(items, {
        foreignKey: 'itemid',
        targetKey: 'itemid'
    });
    // one user maps to one pet, and one pet maps to one user
    jeff.hasOne(pets, {
        foreignKey: 'userid',
        sourceKey: 'userid'
    });
    pets.belongsTo(jeff, {
        foreignKey: 'userid',
        targetKey: 'userid'
    });
    //await items.sync({ force: true }); // this breaks equipment table i think
    const allItems = await updateItemShop(items);
    client.itemCache = allItems;
    await sequelize.sync();
    const nappingUsers = await client.db.jeff.findAll({ where: { napping: { [Op.ne]: null } } });
    nappingUsers.forEach(u => client.napping.set(u.userid, u.napping.getTime()));
    console.log(`Synced ${nappingUsers.length} napping users to cache.`);
    await client.login(token);
})();

async function handleVote(message) {
    const user_id = message.content.split(': ')[1].split(';')[0];
    const user_name = message.content.split('UNBELIEVABLE: ')[1].split(';')[0]; // random ahh "obfuscation" so now no one knows how the voting system works ha
    const user = await jeff.findByPk(user_id);
    try {
        if (user) {
            let reward = 25;
            if (await TopggAPI.isWeekend()) {
                reward = reward * 2;
            }
            user.energy += reward;
            await user.save();
            const user_discord = await client.users.fetch(user_id);
            await user_discord.send(`Thanks for voting! +${reward} energy! ${reward === 25 ? '' : ' (Rewards doubled because it is a weekend!)'}`);
            console.log(`${user_name} (${user_id}) voted and claimed rewards.`);
        }
    } catch (err) {
        console.error("Handle Vote Error:", err);
    }
}

async function handleJeffDonation(message) {
    const [cmd, userId, yesorno, ...msgParts] = message.content.split(' ');
    const msg = msgParts.join(' ');
    try {
        const user = await client.users.fetch(userId);
        if (yesorno === 'y') {
            await user.send('Thank you for your /donatejeff submission to Jeff Bot! Your submission has been approved!\n\nPlease note this bot is currently unable to receive replies. If you would like to stop recieving DMs from Jeff Bot, use /settings.');
        }
        else if (yesorno === 'n') {
            await user.send('Thank you for your /donatejeff submission to Jeff Bot! Unfortunately, your submission was not approved for the following reason: "' + msg + '"\n\nPlease note this bot is currently unable to receive replies. If you would like to stop recieving DMs from Jeff Bot, use /settings.');
        }
        else {
            await user.send(msg + '\n\nPlease note this bot is currently unable to receive replies. If you would like to stop recieving DMs from Jeff Bot, use /settings.');
        }
        await message.reply('DM sent!');
    }
    catch (err) {
        console.error(err);
        await message.reply('Failed to DM.');
    }
}

async function handleInfo(message) {
    const [cmd, userId, ...msgParts] = message.content.split(' ');
    const msg = msgParts.join(' ');
    try {
        const user = await client.users.fetch(userId);
        await user.send(`You recently requested your user information as stored by Jeff Bot. Please find your information below.\n\n${msg}\n\nPlease note this bot is currently unable to receive replies.`);
        await message.reply('DM sent!');
    }
    catch (err) {
        console.error(err);
        await message.reply('Failed to DM.');
    }
}