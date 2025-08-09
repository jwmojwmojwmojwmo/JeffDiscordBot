const { SlashCommandBuilder} = require('discord.js');
const fs = require('fs');
const path = require("path");
const killPath = path.join(__dirname, "..", "..", 'killdata.json')

const killMsg = [
    " got gobbled by Jeff. Chomp chomp! NOM NOM!",
    " was just swallowed by Jeff whole. Slurp slurp!",
    " is now Jeff’s snack. *nomnomnom*",
    " was caught by Jeff in his jaws. Crunch crunch!",
    " vanished... and Jeff’s tummy says thanks! NOMNOM!",
    " got Jeff’ed. Nomfest initiated!"
  ];

function kill(user_id, username) {
    let killData = JSON.parse(fs.readFileSync(killPath)); // reads JSON data
    // JSON data is stored as user_id: [username, killcount]
    if (user_id in killData) {
        killData[user_id][0] = username;
        killData[user_id][1]++;
    } else {
        killData[user_id] = [username, 1];
    }
    fs.writeFileSync(killPath, JSON.stringify(killData, null, 1)); // writes JSON data
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('jeffnom')
		.setDescription('Nom somebody with Jeff')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Who you want to nom?')
                .setRequired(true)),
	async execute(interaction) {
        let name = interaction.options.getUser('user').globalName;
        if (name === null) { // error handling for some discord names
            name = interaction.options.getUser('user').username;
        }
        kill(interaction.options.getUser('user'), name);
		await interaction.reply(name + killMsg[Math.floor(Math.random() * killMsg.length)]); // random kill msg
    },
};