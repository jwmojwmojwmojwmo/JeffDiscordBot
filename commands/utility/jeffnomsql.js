const { SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');
const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const users = require('../../models/users.js')(sequelize, Sequelize.DataTypes);

const killMsg = [
    " got gobbled by Jeff. Chomp chomp! NOM NOM!",
    " was just swallowed by Jeff whole. Slurp slurp!",
    " is now Jeff’s snack. *nomnomnom*",
    " was caught by Jeff in his jaws. Crunch crunch!",
    " vanished... and Jeff’s tummy says thanks! NOMNOM!",
    " got Jeff’ed. Nomfest initiated!"
];

async function kill(userid, user_name) {
    // killData stored as user_id, username, killcount
    const user = await users.findOne({ where: { user_id: userid } });
    if (user) {
        user.increment('killcount');
    } else {
        await users.create({
            user_id: userid,
            username: user_name,
            killcount: 1,
        });
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jeffnomsql')
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
        kill(interaction.options.getUser('user').toString(), name);
        await interaction.reply(name + killMsg[Math.floor(Math.random() * killMsg.length)]); // random kill msg
    },
};