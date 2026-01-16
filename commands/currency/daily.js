import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { getUserAndUpdate } from '../../helpers/utils.js';
import config from '../../helpers/config.json' with { type: "json" };
const { topggAPIKey } = config;
import { Api } from "@top-gg/sdk";
const TopggAPI = new Api(topggAPIKey);

export const data = new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Get your daily!');
export async function execute(interaction) {
    const name = interaction.member?.displayName || interaction.user.username;
    const user = await getUserAndUpdate(interaction.client.db.jeff, interaction.user.id, name, false);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (user.last_daily >= today) {
        await user.save();
        const nextClaim = new Date(today);
        nextClaim.setDate(nextClaim.getDate() + 1); // tomorrow midnight
        console.log(`${user.username} (${user.userid}) attempted to claim their daily`);
        await interaction.reply({ content: `You’ve already claimed your daily today! Next claim <t:${nextClaim.getTime() / 1000}:R>`, flags: MessageFlags.Ephemeral });
    } else {
        user.energy += 25;
        user.last_daily = today;
        await user.save();
        console.log(`${user.username} (${user.userid}) claimed their daily`);
        await interaction.reply({ content: 'Thanks for checking in! You have recieved your daily! +25 energy!', flags: MessageFlags.Ephemeral }); // success
    }
    let voted = false;
    try {
        voted = await TopggAPI.hasVoted(user.userid);
    } catch (err) {
        console.log('TOPGG 404 ERROR -> USER PROBABLY HAS NEVER VOTED BUT TODO: CHECK THIS ERROR'); // TODO
    }
    if (!voted && user.settings.voteReminders) {
        await interaction.followUp({ content: `You haven't voted yet! Run /vote before AND after you vote to get additional rewards!\n\nYou can turn these reminders off by using /settings.`, flags: MessageFlags.Ephemeral });
    }
}