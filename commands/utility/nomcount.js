const { SlashCommandBuilder} = require('discord.js');
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
        if (interaction.options.getUser('nommed_user').globalName == null) {
            name = interaction.options.getUser('nommed_user').username;
        }
		await interaction.reply(name + " has been nommed " + getKills(name) + " times!");
    },
};