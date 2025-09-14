const { SlashCommandBuilder, MessageFlags } = require('discord.js');

async function getDaily(tbl, userid, username) {
    let user = await tbl.findByPk(userid);
    const now = new Date();
    if (user) {
        const lastDaily = user.last_daily;
        user.username = username;
        await victim.save();
        if (now - lastDaily < 24 * 60 * 60 * 1000) {  // Less than 24 hours since last claim
            return false;
        }
        user.energy += 10;  // placeholder
        user.last_daily = now;
        await victim.save();
    }
    else {
        user = await tbl.create({
            userid: userid,
            username: username,
            num_nommed: 0
        });
        console.log(`New user created:`, user.toJSON());
        user.energy += 10;  // placeholder
        user.last_daily = now;
        await victim.save();
    }
    return true;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Get your daily!'),
    async execute(interaction) {
        const tbl = interaction.client.db.jeff;
        let name;
        try {
            name = interaction.member.displayName;
        } catch (err) {
            name = interaction.user.username;
        }
        if (await getDaily(tbl, interaction.options.getUser('user').id, name)) {
            await interaction.reply("Thanks for checking in! You have recieved your daily dose of energy!");
        } else {
            await interaction.reply("You’ve already claimed your daily today!");
        }
    },
};