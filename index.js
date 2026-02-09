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
import { Sequelize } from 'sequelize';
import { AutoPoster } from "topgg-autoposter";
const sequelize = new Sequelize({
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'jeff.sqlite',
});

import jeffFactory from './models/jeff.js';
import rivalsDataFactory from './models/rivalsdata.js';

const jeff = jeffFactory(sequelize, Sequelize.DataTypes);
const rivalsData = rivalsDataFactory(sequelize, Sequelize.DataTypes);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages, // allow DMs
        GatewayIntentBits.MessageContent, // allow reading DM content
    ],
    partials: [Partials.Channel], // needed so DM channels work
});

export default client;

client.commands = new Collection();
client.cooldowns = new Collection();
client.db = { jeff, rivalsData };
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
    console.log(`Ready! Logged in as ${readyClient.user.tag} at ${new Date().toLocaleTimeString()}`);
    scheduleDailyReminders(client, client.db.jeff);
});

// Main command handling function
client.on(Events.InteractionCreate, async interaction => {
    // checks if slash command is slash command and exists
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    // cooldown handling
    const { cooldowns } = interaction.client;

    if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    // const defaultCooldownDuration = 3;
    const cooldownAmount = (command.cooldown) * 1000;

    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

        if (now < expirationTime) {
            const expiredTimestamp = Math.round(expirationTime / 1000);
            return interaction.reply({ content: `\`${command.data.name}\` is on a cooldown. You can use it again <t:${expiredTimestamp}:R>.`, flags: MessageFlags.Ephemeral });
        }
    }
    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    // runs command according to command file with error handling
    try {
        //TODO: pass interaction into helpers and return replies through helper whenever possible
        await command.execute(interaction);
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
});

// DM control
// !dm [userID] [y/n/e] [msg]
// !info [userID] [info]
client.on(Events.MessageCreate, async message => {
    if (message.author.id === ownerId && message.channel.type === 1) { // channel type 1 = DM channel
        if (message.content.startsWith('!dm')) {
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
        if (message.content.startsWith('!info')) {
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
        if (message.content.startsWith('!getinfo')) {
            const [cmd, userId] = message.content.split(' ');
            const user = await client.db.jeff.findByPk(userId);
            await message.reply(JSON.stringify(user, null, 1));
        }
    }
});

AutoPoster(topggAPIKey, client).on("posted", () => {
    console.log("[AutoPoster] Posted stats to Top.gg!");
});

(async () => {
    await jeff.sync();
    // await jeff.sync({ alter: true }); // when modifying db info 
    await rivalsData.sync();
    // await rivalsData.sync({ alter: true }); // when modifying db info 
    await client.login(token);
})();