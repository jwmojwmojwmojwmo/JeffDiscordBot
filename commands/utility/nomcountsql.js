const { SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');
const sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite',
});

const users = require('../../models/users.js')(sequelize, Sequelize.DataTypes);

async function getKills(userid) {
    // killData stored as user_id, username, killcount
    const user = await users.findOne({ where: { user_id: userid } })
    if (user) {
        return user.killcount;
    } else {
        return 0;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nomcountsql')
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
        await interaction.reply(await getKills(interaction.options.getUser('nommed_user').toString()).toString());
    },
};