import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const Status = Object.freeze({
    ONLINE: 'Online - No known issues',
    ONLINEUPDATE: 'Online - Occasional outages expected due to updating the bot - Some actions may not be saved if done during an outage',
    ONLINEISSUE: 'Online - outages expected due to known issue(s) - Some actions may not be saved if done during an outage',
    ONLINEUNKNOWN: 'Online - outages expected due to unknown reasons - Some actions may not be saved if done during an outage',
    ONLINESLOW: 'Online - expect slower response times',
    ONLINEPANIC: 'Online - Stability uncertain (bot may go down anytime) mrr... :('
});

const now = Math.floor(Date.now() / 1000);
const timea = "<t:1771659000:f>";
const statusEmbed = new EmbedBuilder()
    .setTitle('Jeff Discord Bot Status')
    .setThumbnail('https://i.imgur.com/ntg31Zx.jpeg')
    .addFields(
        { name: `Status: ${Status.ONLINE}`, value: `\nPlanned to go offline for 12 hours starting at ${timea}` },
        { name: `Known issues:`, value: `Voting was recently changed, and /skillcheck is new and experimental! Please report any issues.` },
        { name: 'Latest update: v0.85', value: 'Changes: HI GUYS I\'M BACK! Sorry for the break. Anyways the recent update was pretty small, but I learned a lot about webhooks and stuff. Basically the voting system should work a lot better. Stay tuned for actual big updates in the near future!\nAdded /quiz! Earn energy by answering trivia questions about Jeff with various difficulties. If you have any suggestions for new quiz questions, feel free to send it using /donatesuggestions!' },
        { name: 'Comments:', value: '\nHi guys!' },
        { name: '\u200B', value: `Updated at <t:${now}:f>` },
    );

export const data = new SlashCommandBuilder()
    .setName('status')
    .setDescription('Get status of bot and most recent update notes');
export async function execute(interaction) {
    console.log(`Status was checked.`);
    await interaction.reply({ embeds: [statusEmbed] });
}