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

function kill(user) {
    let killData = JSON.parse(fs.readFileSync(killPath));
    if (user in killData) {
        killData[user]++;
    } else {
        killData[user] = 1;
    }
    fs.writeFileSync(killPath, JSON.stringify(killData, null, 2));
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
        if (interaction.options.getUser('user').globalName == null) {
            name = interaction.options.getUser('user').username;
        }
        kill(name);
		await interaction.reply(name + killMsg[Math.floor(Math.random() * killMsg.length)]);
    },
};