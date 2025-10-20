const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Ping the bot'),
	async execute(interaction) {
		const sent = await interaction.reply({ content: 'Pinging...', withResponse: true, flags: MessageFlags.Ephemeral });
		interaction.editReply(`Roundtrip latency: ${sent.resource.message.createdTimestamp - interaction.createdTimestamp}ms`);
        console.log(`Jeff was pinged.`);
	},
};