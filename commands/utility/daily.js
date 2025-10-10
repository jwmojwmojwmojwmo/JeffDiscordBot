const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUserAndUpdate } = require('../../utils.js');

// returns -1 if success, otherwise returns unix time until next daily
async function getDaily(tbl, userid, username) {
    let user = await getUserAndUpdate(tbl, userid, username, false);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (user.last_daily >= today) {
        await user.save();
        const nextClaim = new Date(today);
        nextClaim.setDate(nextClaim.getDate() + 1); // tomorrow midnight
        return Math.floor(nextClaim.getTime() / 1000);
    }
    user.energy += 25;
    user.last_daily = today;
    await user.save();
    return -1; // success
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Get your daily!'),
    async execute(interaction) {
        let name = interaction.member?.displayName || interaction.user.username;
        const success = await getDaily(interaction.client.db.jeff, interaction.user.id, name);
        if (success === -1) {
            await interaction.reply({ content: 'Thanks for checking in! You have recieved your daily! +25 energy!', flags: MessageFlags.Ephemeral });
        }
        else {
            await interaction.reply({ content: `You’ve already claimed your daily today! Next claim <t:${success}:R>`, flags: MessageFlags.Ephemeral });
        }
    },
};