const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require("path");
const assetsDir = path.join(__dirname, "..", "..", 'assets');

const aboutEmbed = new EmbedBuilder()
    .setTitle('Jeff Discord Bot')
    .setURL('https://luwu.pythonanywhere.com/')
    .setAuthor({ name: 'jwmo', iconURL: 'https://i.imgur.com/e0xvSJ9.png', url: 'https://luwu.pythonanywhere.com/' })
    .setDescription("Best Jeff bot ever! Jeff's the cutest and he deserves all the bots yes yes nom nom. Use the Wiki on the linked GitHub page to see what the commands do, or just play around with Jeff hehe. " +
        "Please use the linked GitHub for issue reporting, feature suggestions, and contact information too! \n Please note the bot is in beta and I'm a broke college student, so the bot being up all the time is not guaranteed. Consider donating so that I can find an actual way to host the bot and be more motivated to actually fix my code and add things. (jk I'm too addicted to Marvel Rivals either way)")
    .setThumbnail("https://i.imgur.com/ntg31Zx.jpeg")
    .addFields(
        { name: 'GitHub', value: 'https://github.com/jwmojwmojwmojwmo/JeffDiscordBot' },
        { name: 'Buy Me A Coffee', value: 'https://buymeacoffee.com/jwmo' },
        //{ name: '\u200B', value: '\u200B', inline: true }, //empty field
        { name: 'Credits', value: "Developed by jwmo. Assets provided by Woofie and gavdingo.\nSpecial thanks to CrabKevin for his contributions!" },
    )
    //.setImage("https://i.imgur.com/ntg31Zx.jpeg")
    .setTimestamp()
    .setFooter({ text: 'Jeff Bot by jwmo, all rights reserved', iconURL: 'https://i.imgur.com/e0xvSJ9.png' });
    
module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('About the bot'),
    async execute(interaction) {
        await interaction.reply({ embeds: [aboutEmbed] });
    },
};  