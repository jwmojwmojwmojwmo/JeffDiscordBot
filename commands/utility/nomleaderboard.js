const { SlashCommandBuilder, bold } = require('discord.js');
const fs = require('fs');
const path = require("path");
const killPath = path.join(__dirname, "..", "..", 'killdata.json')

// function getTopFive() {
//     let killData = JSON.parse(fs.readFileSync(killPath)); // read JSON file
//     const entries = Object.entries(killData); //makes entries out of kill data
//     entries.sort((a, b) => b[1][1] - a[1][1]); // sorts entries by value high to low
//     const topFive = Array.from(new Map(entries)).slice(0, 5); // grabs first five entries
//     let leaderboard = "Top Users Nommed:\n";
//     let rank = 1;
//     for (const[user, [username, nomcount]] of topFive) {
//         leaderboard = leaderboard + "\n#" + bold(rank) + " " + username + ": " + nomcount + " times nommed!"
//         rank++;
//     }
//     return leaderboard;
// }

async function getTopFive(tbl) {
    const results = await tbl.findAll({
        attributes: ['username', 'num_nommed'],
    })
    const entries = results.map(p => p.toJSON()); //converts obj response w/ metadata to raw arr resp    
    entries.sort((a, b) => b.num_nommed - a.num_nommed); // sorts entries by value high to low
    const topFive = entries.slice(0, 5); // grabs first five entries

    let leaderboard = "Top Users Nommed:\n";
    let rank = 1;
    for (const user of topFive) {
        if (user.num_nommed === 1) {
            leaderboard += "\n#" + bold(rank) + " " + user.username + ": 1 time nommed!"
        } else {
            leaderboard += "\n#" + bold(rank) + " " + user.username + ": " + user.num_nommed + " times nommed!"
        }
        rank++;
    }
    return leaderboard;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nomleaderboard')
        .setDescription('Leaderboard of noms'),
    async execute(interaction) {
        const tbl = interaction.client.db.jeff;
        await interaction.reply(await getTopFive(tbl));
    },
};