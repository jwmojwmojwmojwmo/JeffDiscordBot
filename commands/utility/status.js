const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

const offlineinhours = 1; // change this value for time until bot goes offline (in hours from time when commands deployed)
const onlineinhours = 12; // change this value for time until bot comes back online (in hours after bot goes offline)

const now = Math.floor(Date.now() / 1000);
const timea = now + (offlineinhours * 60 * 60); // in form now + ('time in hours' * 60 * 60)
const timeb = timea + (onlineinhours * 60 * 60); 
const statusEmbed = new EmbedBuilder()
    .setTitle('Jeff Discord Bot Status')
    .setThumbnail("https://i.imgur.com/ntg31Zx.jpeg")
    .addFields(
        { name: 'Status: Online - occasional short outages anticipated due to updating the bot', value: `Planned to go offline <t:${timea}:R>, planned to come back online <t:${timeb}:R> (times are approximate)` },
        { name: 'Latest update: v0.73b', value: 'Changes: \nQueries Google Gemini API when doing /jeffspeak to get a much more accurate response. No randomisation needed! This may be buggy, please report any issues in the GitHub! (I can\'t tell if this API is free I sure hope it is)\n Also, /daily added! What does it give? Well...I suppose we shall find out...' },
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