import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { getUserAndUpdate } from '../../helpers/utils.js';
import config from '../../helpers/config.json' with { type: "json" };
const { topggAPIKey } = config;
import { Api } from "@top-gg/sdk";
const TopggAPI = new Api(topggAPIKey);

function calculateEnergyBonus(streak) {
    let bonus = 0;
    if (streak <= 31) {
        bonus = 25 * Math.pow(1.05, streak);
    } else if (streak <= 365) {
        bonus = 100 + (25 * Math.pow(1.01, streak));
    } else {
        bonus = 3*streak;
    }
    return Math.round(bonus);
}

export const data = new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Get your daily!');
export async function execute(interaction) {
    const name = interaction.member?.displayName || interaction.user.displayName;
    const user = await getUserAndUpdate(interaction.client.db, interaction.user.id, name, false);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    let lost_daily = false;
    yesterday.setDate(yesterday.getDate() - 1);
    let last_daily = user.last_daily ? new Date(user.last_daily) : null;
    if (last_daily && last_daily >= yesterday.getDate()) {
        user.daily_streak += 1;
    } else {
        user.daily_streak = 0;
        lost_daily = true;
    }
    if (last_daily && last_daily >= today) {
        await user.save();
        const nextClaim = new Date(today);
        nextClaim.setDate(nextClaim.getDate() + 1); // tomorrow midnight
        console.log(`${user.username} (${user.userid}) attempted to claim their daily`);
        await interaction.reply({ content: `You’ve already claimed your daily today! Next claim <t:${nextClaim.getTime() / 1000}:R>`, flags: MessageFlags.Ephemeral });
    } else {
        const energyBonus = calculateEnergyBonus(user.daily_streak) - 25;
        user.energy += energyBonus + 25;
        user.last_daily = today;
        await user.save();
        console.log(`${user.username} (${user.userid}) claimed their daily`);
        await interaction.reply({ content: `Thanks for checking in! You have recieved your daily! +25 energy!\n\nYou have recieved an additional ${energyBonus} energy for your ${user.daily_streak} day streak!`, flags: MessageFlags.Ephemeral }); // success
        if (lost_daily) {
            await interaction.followUp({ content: `You lost your daily streak! Your streak has been reset to 0.`, flags: MessageFlags.Ephemeral });
        }
    }
    let voted = false;
    try {
        voted = await TopggAPI.hasVoted(user.userid);
    } catch (err) {
        console.log('TOPGG 404 ERROR -> USER PROBABLY HAS NEVER VOTED BUT TODO: CHECK THIS ERROR'); // TODO
    }
    if (!voted && user.settings.voteReminders) {
        await interaction.followUp({ content: `You haven't voted yet! Vote for Jeff Bot on Top.gg to get additional rewards (see /vote for more info)!\n\nYou can turn these reminders off by using /settings.`, flags: MessageFlags.Ephemeral });
    }
}