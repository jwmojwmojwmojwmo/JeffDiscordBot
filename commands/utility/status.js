const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

const offlineinhours = 6; // change this value for time until bot goes offline (in hours from time when commands deployed)
const onlineinhours = 12; // change this value for time until bot comes back online (in hours after bot goes offline)

const now = Math.floor(Date.now() / 1000);
const timea = now + (offlineinhours * 60 * 60); // in form now + ('time in hours' * 60 * 60)
const timeb = timea + (onlineinhours * 60 * 60);
const statusEmbed = new EmbedBuilder()
	.setTitle('Jeff Discord Bot Status')
	.setThumbnail('https://i.imgur.com/ntg31Zx.jpeg')
	.addFields(
		{ name: 'Status: Online - occasional short outages anticipated due to updating the bot', value: `Planned to go offline <t:${timea}:R>, planned to come back online <t:${timeb}:R> (times are approximate)` },
		{ name: 'Latest update: v0.8b', value: 'Changes: \n/daily added! Claim your daily to get energy! \n /spit and /bubble added! Use your energy to spit on someone to lower their reputation if they wronged you, or use it for good and bubble someone instead, and give them reputation! Top reputation scores are shown on the leaderboard!'},
		{ name: 'Next major update sneak peek: v0.9b', value: 'Gambling... hehehe' },
		{ name: '\u200B', value: `Updated at <t:${now}:T>` },
	);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('status')
		.setDescription('Get status of bot and most recent update notes'),
	async execute(interaction) {
		await interaction.reply({ embeds: [statusEmbed] });
	},
};