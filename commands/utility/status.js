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
const timea = "<t:1777617900:f>";
const statusEmbed = new EmbedBuilder()
    .setTitle('Jeff Discord Bot Status')
    .setThumbnail('https://i.imgur.com/ntg31Zx.jpeg')
    .addFields(
        { name: `Status: ${Status.ONLINEUPDATE}`, value: `\nPlanned to go offline for 12 hours starting at ${timea}` },
        { name: `Known issues:`, value: `Many new commands were recently added! Please /donatesuggestions to report any issues or give feedback.` },
        { name: 'Latest update: v0.90', value: 'We are so back GUYS! Welcome to v0.9, the biggest update yet. We have fishing, pets, and more! Also blackjack is finally here yayy!!' },
        { name: 'New commands:', value: '/fish, /inventory, /item, /nap, /rank, /trader, /play blackjack, /pet view, /pet feed, /pet pet, /pet play, /pet disown, /use, /help' },
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