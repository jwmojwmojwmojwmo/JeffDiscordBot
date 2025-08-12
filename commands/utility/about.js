const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('About the bot'),
    async execute(interaction) {
        await interaction.reply("Best Jeff bot ever! Jeff's the cutest and he deserves all the bots yes yes nom nom.\n\nDeveloped by jwmo." +
            "\nAssets provided by Woofie and gavdingo.\nSpecial thanks to CrabKevin for his contributions!" +
            "\nGithub link: https://github.com/jwmojwmojwmojwmo/JeffDiscordBot");
    },
};  