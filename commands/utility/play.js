const { SlashCommandBuilder, MessageFlags } = require('discord.js');

// module.exports = {
//     data: new SlashCommandBuilder()
//         .setName('play')
//         .setDescription('Play a game with Jeff!')
//         .addSubcommand(subcommand =>
//             subcommand
//                 .setName('highlow')
//                 .setDescription('Guess if the number Jeff is thinking of is lower or higher, winning gives energy'))
//         .addSubcommand(subcommand =>
//             subcommand
//                 .setName('blackjack')
//                 .setDescription('Bet reputation to play blackjack against Jeff')
//                 .addIntegerOption(option =>
//                     option.setName('bet')
//                         .setDescription('Reputation you would like to bet')
//                         .setRequired(true))),
//     async execute(interaction) {
//         await interaction.reply("success");
//     },
// };