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
const timea = "<t:1789800300:f>"; //09/18/2026
const statusEmbed = new EmbedBuilder()
    .setTitle('Jeff Discord Bot Status')
    .setThumbnail('https://i.imgur.com/ntg31Zx.jpeg')
    .addFields(
        { name: `Status: ${Status.ONLINE}`, value: `\nPlanned to go offline for 12 hours starting at ${timea}` },
        { name: `Known issues:`, value: `The Marvel Rivals API I use is currently unavailable/outdated. /skillcheck may not work as expected.\n\n Please /donatesuggestions to report any issues or give feedback.` },
        { name: 'Latest update: v0.91', value: 'The bot was recently updated to v0.91! See notes below. And please do report any bugs <3 \n\n- /profile is here! This is a new consolidated view replacing /stats and /rank, and lets you equip unlockable titles.\n- /daily now rewards you with dynamic energy multipliers for keeping up your streak.\n- /speak got a brain upgrade, Jeffy should be a little smarter now.\n- Added helpful tooltips, leaderboard improvements, and *maybe* a little secret...' },
        { name: 'Comments:', value: '\nJeff bot is now verified! Thank you for all the support. Again, any and all feedback is appreciated through /donatesuggestions.' },
        { name: '\u200B', value: `Updated at <t:${now}:f>` },
    );

export const data = new SlashCommandBuilder()
    .setName('status')
    .setDescription('Get status of bot and most recent update notes');
export async function execute(interaction) {
    console.log(`Status was checked.`);
    await interaction.reply({ embeds: [statusEmbed] });
}
