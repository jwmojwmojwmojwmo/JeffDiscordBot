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

async function getKills(tbl, user_id) {
    let user_obj = await tbl.findByPk(user_id);
    if (user_obj) {
        user_obj.num_queries += 1;
        return user_obj.num_nommed;
    }
    return 0;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nomcount')
        .setDescription('Provides information about the number of noms.')
        .addUserOption(option =>
            option
                .setName('nommed_user')
                .setDescription("User that you want to see number of noms of")
                .setRequired(true)),
    async execute(interaction) {
        const tbl = interaction.client.db.jeff;
        let msg = interaction.options.getMember('nommed_user').displayName;
        let numkills = await getKills(tbl, interaction.options.getUser('nommed_user').toString());
        if (numkills === 1) { // 1 time vs multiple times in message
            msg += " has been nommed 1 time!";
        } else {
            msg += " has been nommed " + numkills + " times!";
        }
        await interaction.reply(msg);
    },
};