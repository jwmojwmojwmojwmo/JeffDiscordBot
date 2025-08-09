const { SlashCommandBuilder, bold} = require('discord.js');
const fs = require('fs');
const path = require("path");
const killPath = path.join(__dirname, "..", "..", 'killdata.json')

function getTopFive() {
    let killData = JSON.parse(fs.readFileSync(killPath)); // read JSON file
    const entries = Object.entries(killData);
    entries.sort((a, b) => b[1] - a[1]); // sorts entries by value high to low
    const topFive = Array.from(new Map(entries)).slice(0, 5); // grabs first five entries
    let leaderboard = "Top Users Nommed:\n";
    let rank = 1;
    for (const[user, nomcount] of topFive) {
        leaderboard = leaderboard + "\n#" + bold(rank) + " " + user + ": " + nomcount + " times nommed!"
        rank++;
    }
    return leaderboard;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('nomleaderboard')
		.setDescription('Leaderboard of noms'),
	async execute(interaction) {
		await interaction.reply(getTopFive());
    },
};