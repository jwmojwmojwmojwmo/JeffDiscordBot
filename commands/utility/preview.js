// import { SlashCommandBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

// const linkButton = new ButtonBuilder()
//     .setURL('https://discord.com/oauth2/authorize?client_id=1427464276553240668')
//     .setLabel('Invite Link')
//     .setStyle(ButtonStyle.Link);
// const linkRow = new ActionRowBuilder().addComponents(linkButton);

// export const data = new SlashCommandBuilder()
//     .setName('preview')
//     .setDescription('Check out Jeff Bot Beta!');
// export async function execute(interaction) {
//     await interaction.reply({ content: 'Want to check out the latest features that are currently in development? Use the link below to get access to Jeff Bot Beta! Please /donatesuggestions to give any feedback! \n\nDisclaimer: Jeff Bot Beta is a work in progress and has no guarantees of uptime or data persistance, and also may require Administrator permissions in a server. If you want to have a stable copy, run the beta branch locally from GitHub.', components: [linkRow], flags: MessageFlags.Ephemeral });
//     console.log(`Preview was checked`);
// }