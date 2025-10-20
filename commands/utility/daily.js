const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUserAndUpdate } = require('../../utils.js');
const { topggAPIKey, ownerId, testerId } = require('../../config.json');
const Topgg = require("@top-gg/sdk");
const TopggAPI = new Topgg.Api(topggAPIKey);

// returns -1 if success, otherwise returns unix time until next daily
async function getDaily(tbl, user) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (user.last_daily >= today) {
        await user.save();
        const nextClaim = new Date(today);
        nextClaim.setDate(nextClaim.getDate() + 1); // tomorrow midnight
        console.log(`${user.username} (${user.userid}) attempted to claim their daily`); // TODO: use user_name instead of user.username and so forth
        return Math.floor(nextClaim.getTime() / 1000);
    }
    user.energy += 25;
    user.last_daily = today;
    await user.save();
    console.log(`${user.username} (${user.userid}) claimed their daily`);
    return -1; // success
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Get your daily!'),
    async execute(interaction) {
        let name = interaction.member?.displayName || interaction.user.username;
        let user = await getUserAndUpdate(interaction.client.db.jeff, interaction.user.id, name, false);
        const success = await getDaily(interaction.client.db.jeff, user);
        if (success === -1) {
            await interaction.reply({ content: 'Thanks for checking in! You have recieved your daily! +25 energy!', flags: MessageFlags.Ephemeral });
        }
        else {
            await interaction.reply({ content: `You’ve already claimed your daily today! Next claim <t:${success}:R>`, flags: MessageFlags.Ephemeral });
        }
        if (user.userid === ownerId || user.userid === testerId) {
            let voted = await TopggAPI.hasVoted(user.userid);
            if (!voted && user.settings.voteReminders) {
                await interaction.followUp({ content: `You haven't voted yet! Run /vote before AND after you vote to get additional rewards!\n\nYou can turn these reminders off by using /settings.`, flags: MessageFlags.Ephemeral });
            }
        }
    },
};