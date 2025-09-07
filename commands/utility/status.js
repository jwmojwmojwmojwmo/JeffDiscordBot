const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

const now = Math.floor(Date.now() / 1000);
const timea = now + (1.5 * 60 * 60); // in form now + ('time in hours' * 60 * 60)
const timeb = now + (12 * 60 * 60); // in form now + ('time in hours' * 60 * 60)
const statusEmbed = new EmbedBuilder()
    .setTitle('Jeff Discord Bot Status')
    .setThumbnail("https://i.imgur.com/ntg31Zx.jpeg")
    .addFields(
        { name: 'Status', value: `Planned to go offline <t:${timea}:R>, planned to come back online <t:${timeb}:R>` },
        { name: 'Latest update: v0.7b', value: 'Changes: \nAdded /status command to check status and update notes. ' },
        { name: 'Next update sneak peek: v0.8b', value: "Planning to add /spit and /bubble...details will be revealed at a later date." },
        { name: '\u200B', value: '\u200B', inline: true }, //empty field
        { name: '\u200B', value: `Updated at <t:${now}:T>` },
    )

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Get status of bot and most recent update notes'),
    async execute(interaction) {
        await interaction.reply({ embeds: [statusEmbed] });
    },
};  