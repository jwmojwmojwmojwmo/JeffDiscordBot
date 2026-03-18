import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

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
    .setTitle('Jeff Discord Bot v0.9 BETA')
    .setURL('https://luwu.pythonanywhere.com/')
    .setAuthor({ name: 'jwmo', iconURL: 'https://i.imgur.com/e0xvSJ9.png', url: 'https://luwu.pythonanywhere.com/' })
    .setDescription('Welcome to Jeff Bot Beta! Anything may break at any time, use with caution! Any concerns should be submitted with /donatesuggestions. Ensure DMs are open in case we need to follow up with you.')
    .setThumbnail('https://i.imgur.com/ntg31Zx.jpeg')
    .addFields(
        // { name: '\u200B', value: '\u200B', inline: true }, //empty field
        { name: 'Credits', value: 'Created with love by jwmo.\nDeveloped in partnership with Woofie.\nSpecial thanks to CrabKevin for his contributions!\nAnd a big thanks to everyone who donates Jeff pictures!' },
    )
    // .setImage("https://i.imgur.com/ntg31Zx.jpeg")    
    .setFooter({ text: 'Jeff Bot by jwmo, all rights reserved', iconURL: 'https://i.imgur.com/e0xvSJ9.png' });

export const data = new SlashCommandBuilder()
    .setName('about')
    .setDescription('About the bot');
export async function execute(interaction) {
    console.log(`About was checked.`);
    await interaction.reply({ embeds: [aboutEmbed], components: [linkRow] });
}