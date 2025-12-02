const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

const offlineinhours = 36; // change this value for time until bot goes offline (in hours from time when commands deployed)
const onlineinhours = 12; // change this value for time until bot comes back online (in hours after bot goes offline)

const Status = Object.freeze({
    ONLINE: 'Online - No known issues',
    ONLINEUPDATE: 'Online - Occasional outages expected due to updating the bot - Some actions may not be saved if done during an outage',
    ONLINEISSUE: 'Online - outages expected due to known issue(s) - Some actions may not be saved if done during an outage',
    ONLINEUNKNOWN: 'Online - outages expected due to unknown reasons - Some actions may not be saved if done during an outage',
    ONLINESLOW: 'Online - expect slower response times',
    ONLINEPANIC: 'Online - Stability uncertain (bot may go down anytime) mrr... :('
});

const now = Math.floor(Date.now() / 1000);
const timea = "<t:1764658800:f>";
const statusEmbed = new EmbedBuilder()
    .setTitle('Jeff Discord Bot Status')
    .setThumbnail('https://i.imgur.com/ntg31Zx.jpeg')
    .addFields(
        { name: `Status: ${Status.ONLINEUPDATE}`, value: `\nPlanned to go offline for 12 hours starting at ${timea}` },
        { name: `Known issues:`, value: `/skillcheck is new and experimental! Please report any issues.` },
        { name: 'Latest update: v0.85', value: 'Changes:\nAdded /quiz! Earn energy by answering trivia questions about Jeff with various difficulties. If you have any suggestions for new quiz questions, feel free to send it using /donatesuggestions!\nAdded 30+ new Jeff pictures! Thank you to everyone who donates Jeffys!' },
        { name: 'Comments:', value: '\nWith finals coming up and the codebase becoming increasingly unorganised, the next update will be very small and probably just focus on fixing the issues in the bot. Rest assured that new features are planned and coming in the new year!' },
        { name: '\u200B', value: `Updated at <t:${now}:f>` },
    );

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Get status of bot and most recent update notes'),
    async execute(interaction) {
        console.log(`Status was checked.`);
        await interaction.reply({ embeds: [statusEmbed] });
    },
};