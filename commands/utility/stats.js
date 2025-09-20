const { SlashCommandBuilder } = require('discord.js');
// imports for old JSON file storage
// const fs = require('fs');
// const path = require("path");
// const killPath = path.join(__dirname, "..", "..", 'killdata.json')

// getKills function for JSON file
// function getKills(user) {
//     let killData = JSON.parse(fs.readFileSync(killPath));
//     if (user in killData) {
//         return killData[user][1];
//     } else {
//         return 0;
//     }
// }

async function getKills(tbl, user_id, username) {
    let user_obj = await tbl.findByPk(user_id);
    if (user_obj) {
        user_obj.username = username;
        await user_obj.save();
        return user_obj.num_nommed;
    }
    const newUser = await tbl.create({
        userid: user_id,
        username: username,
        num_nommed: 0
    });
    console.log(`New user created:`, newUser.toJSON());
    return 0;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Provides information of a user\'s stats.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription("User that you want to see stats of")
                .setRequired(true))
        .addStringOption(option =>
            option.setName('stat_type')
                .setDescription('Type of stat you want to see')
                .setRequired(true)
                .addChoices(
                    { name: 'nom_count', value: 'nomcount' }
                )),
    async execute(interaction) {
        const tbl = interaction.client.db.jeff;
        let msg;
        try {
            msg = interaction.options.getMember('user').displayName;
        } catch (err) {
            msg = interaction.options.getUser('user').username;
        }
        if (interaction.options.getString('stat_type') === 'nomcount') {
            let numkills = await getKills(tbl, interaction.options.getUser('user').id, msg);
            if (numkills === 1) { // 1 time vs multiple times in message
                msg += " has been nommed 1 time!";
            } else {
                msg += " has been nommed " + numkills + " times!";
            }
        }
        await interaction.reply(msg);
    },
};