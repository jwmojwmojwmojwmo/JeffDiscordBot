const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags, Partials, ActivityType } = require('discord.js');
const { token, ownerId } = require('./config.json');
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'jeff.sqlite'
});
const jeff = require('./models/jeff.js')(sequelize, Sequelize.DataTypes);
const errPath = 'errors.txt';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
		GatewayIntentBits.DirectMessages, // allow DMs
		GatewayIntentBits.MessageContent, // allow reading DM content
	],
	partials: [Partials.Channel], // needed so DM channels work
});

module.exports = client;

/* I presume this will be the area that we add file location constants, so I will add the database stuff here too*/
client.commands = new Collection();
client.cooldowns = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
// Jeff is the name of the db. For sqlite applications the user and password are not integral to its function.
// jeff = create_jeff_sqlite('jeff', 'user', 'password');

// Runs on initialization, grabs all commands in commands folder
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		}
		else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

function reportError(err) {
	const date = new Date();
	fs.appendFileSync(errPath, err.stack + ', ' + date.toLocaleString() + '\n\n');
	console.error(err);
}

client.db = { jeff };

client.once(Events.ClientReady, readyClient => {
	client.user.setActivity('/jeff', { type: ActivityType.Listening });
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    // TODO: message reminders for daily
});

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
		await command.execute(interaction);
	}
	catch (error) {
		reportError(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'Something unexpected happened while interacting with this command. Note that Discord messages must be 2000 characters or fewer.', flags: MessageFlags.Ephemeral });
		}
		else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
	}
});

// DM control
// !dm [userID] [y/n/e] [msg]
client.on(Events.MessageCreate, async message => {
	if (message.author.id === ownerId && message.channel.type === 1) {
		if (message.content.startsWith('!dm') && message.author.id === ownerId && message.channel.type === 1) { // channel type 1 = DM channel
			const [cmd, userId, yesorno, ...msgParts] = message.content.split(' ');
			const msg = msgParts.join(' ');
			try {
				const user = await client.users.fetch(userId);
				if (yesorno === 'y') {
					await user.send('Thanks for your submission to Jeff Bot! Your submission has been approved!\n\nPlease note this bot is currently unable to receive replies.');
				}
				else if (yesorno === 'n') {
					await user.send('Thanks for your submission to Jeff Bot! Unfortunately, your submission was not approved for the following reason: "' + msg + '"\n\nPlease note this bot is currently unable to receive replies.');
				}
				else {
					await user.send(msg + '\n\nPlease note this bot is currently unable to receive replies.');
				}
				await message.reply('DM sent!');
			}
			catch (err) {
				reportError(err);
				await message.reply('Failed to DM.');
			}
		}
	}
});
(async () => {
	await jeff.sync(); // jeff.sync({ alter: true }); when modifying db info
	await client.login(token);
})();