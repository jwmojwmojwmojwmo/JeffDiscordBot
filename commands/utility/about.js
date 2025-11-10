const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

// constants for link buttons
const GitHubButton = new ButtonBuilder()
    .setURL('https://github.com/jwmojwmojwmojwmo/JeffDiscordBot')
    .setLabel('GitHub')
    .setStyle(ButtonStyle.Link); // button styles: Primary => blue button, Secondary => Gray button, Success => Green button, Danger => Red button
const TopGGButton = new ButtonBuilder()
    .setURL('https://top.gg/bot/1403391763510464663')
    .setLabel('TopGG')
    .setStyle(ButtonStyle.Link);
const BuyMeACoffeeButton = new ButtonBuilder()
    .setURL('https://buymeacoffee.com/jwmo')
    .setLabel('Buy Me A Coffee')
    .setStyle(ButtonStyle.Link);
const linkRow = new ActionRowBuilder().addComponents(GitHubButton, TopGGButton, BuyMeACoffeeButton); // the row of buttons below the text

const aboutEmbed = new EmbedBuilder()
    .setTitle('Jeff Discord Bot v0.84')
    .setURL('https://luwu.pythonanywhere.com/')
    .setAuthor({ name: 'jwmo', iconURL: 'https://i.imgur.com/e0xvSJ9.png', url: 'https://luwu.pythonanywhere.com/' })
    .setDescription('Best Jeff bot ever! Jeff\'s the cutest and he deserves all the bots yes yes nom nom. Use the Wiki on the linked GitHub page for any questions, or just play around with Jeff hehe. ' +
        'Please use the linked GitHub for issue reporting, feature suggestions, and contact information too! \n Please note the bot is in beta and I\'m a broke college student, so the bot being up all the time is not guaranteed. Consider donating or voting for the bot on Top.gg so that I can be more motivated to find an actual way to host the bot and actually fix my code and figure out why Top.gg api hates me. (jk I\'m too addicted to Marvel Rivals either way)')
    .setThumbnail('https://i.imgur.com/ntg31Zx.jpeg')
    .addFields(
        // { name: '\u200B', value: '\u200B', inline: true }, //empty field
        { name: 'Credits', value: 'Created with love by jwmo.\nDeveloped in partnership with Woofie.\nSpecial thanks to CrabKevin for his contributions!\nAnd a big thanks to everyone who donates Jeff pictures!' },
    )
    // .setImage("https://i.imgur.com/ntg31Zx.jpeg")
    .setTimestamp()
    .setFooter({ text: 'Jeff Bot by jwmo, all rights reserved', iconURL: 'https://i.imgur.com/e0xvSJ9.png' });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('About the bot'),
    async execute(interaction) {
        console.log(`About was checked.`);
        await interaction.reply({ embeds: [aboutEmbed], components: [linkRow] });
    },
};