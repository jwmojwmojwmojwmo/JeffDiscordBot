const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require("path");
const killPath = path.join(__dirname, "..", "..", 'killdata.json')

function getKills(user) {
    let killData = JSON.parse(fs.readFileSync(killPath));
    if (user in killData) {
        return killData[user];
    } else {
        return 0;
    }
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
        let name = interaction.options.getUser('nommed_user').globalName;
        if (name == null) { // error handling for some discord names
            name = interaction.options.getUser('nommed_user').username;
        }
        let msg = name;
        if (getKills(name) === 1) { // 1 time vs multiple times in message
            msg = msg + " has been nommed 1 time!";
        } else {
            msg = msg + " has been nommed " + getKills(name) + " times!";
        }
        await interaction.reply(msg);
    },
};