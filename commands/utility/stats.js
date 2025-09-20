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


// TODO: ABSTRACTION

async function getStat(tbl, user_id, username, stat_type) {
    let user_obj = await tbl.findByPk(user_id);
    if (user_obj) {
        user_obj.username = username;
        await user_obj.save();
    } else {
        user_obj = await tbl.create({
            userid: user_id,
            username: username
        });
        console.log(`New user created:`, user_obj.toJSON());
    }
    if (stat_type !== 'all_stats') {
    return user_obj[stat_type];
    }
    return {
        nom_count: user_obj.num_nommed,
        energy: user_obj.energy,
        reputation: user_obj.reputation
    };
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
                    { name: 'all_stats', value: 'all_stats' },
                    { name: 'nom_count', value: 'num_nommed' },
                    { name: 'energy', value: 'energy' },
                    { name: 'reputation', value: 'reputation' }
                )),
    async execute(interaction) {
        const tbl = interaction.client.db.jeff;
        let msg;
        try {
            msg = interaction.options.getMember('user').displayName;
        } catch (err) {
            msg = interaction.options.getUser('user').username;
        }
        const statType = interaction.options.getString('stat_type');
        const stat = await getStat(tbl, interaction.options.getUser('user').id, msg, statType);
        if (statType === 'num_nommed') {
            msg += ` has been nommed ${stat} time${stat === 1 ? '' : 's'}!` // 1 time vs multiple times in message
        } else if (statType === 'all_stats') {
            msg += `'s stats:\n\nTimes nommed: ${stat.nom_count}\nEnergy: ${stat.energy}\nReputation: ${stat.reputation}`;
        } else {
            msg += ` has ${stat} ${statType}!`;
        }
        await interaction.reply(msg);
    },
};