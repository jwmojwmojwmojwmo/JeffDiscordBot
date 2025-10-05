const { SlashCommandBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const lowerButton = new ButtonBuilder()
    .setCustomId('lower')
    .setLabel('Lower')
    .setStyle(ButtonStyle.Secondary);
const higherButton = new ButtonBuilder()
    .setCustomId('higher')
    .setLabel('Higher')
    .setStyle(ButtonStyle.Secondary);
const jackpotButton = new ButtonBuilder()
    .setCustomId('jackpot')
    .setLabel('Jackpot')
    .setStyle(ButtonStyle.Primary);
const highLowRow = new ActionRowBuilder().addComponents(lowerButton, jackpotButton, higherButton);

// TODO: optimise
async function playHighLow(interaction, tbl, user_name, user_id) {
    const thinkingNum = Math.floor(Math.random() * 101); // the num jeffy is thinking of, 0-100
    const givenNum = Math.floor(Math.random() * 101); // the num the user sees, 0-100
    const highLowResponse = await interaction.reply({
        content: `Jeff says: MRR!!! MRRRR MRR!! YUMMY YUMMY! (translation: I'm thinking of a number from 1-100! Is it lower or higher than ${givenNum}?)\nUse Jackpot if you think they're the same number!`,
        components: [highLowRow],
        withResponse: true,
    });
    let user = await tbl.findByPk(user_id); // find user from db
    if (user) {
        user.username = user_name; // update user's name if they exist in db
    }
    else {
        user = await tbl.create({ // create user if they do not exist
            userid: user_id,
            username: user_name,
        });
        console.log('New user created:', user.toJSON());
    }
    const collectorFilter = i => i.user.id === interaction.user.id; // check the person who pressed the button is the person who started the interaction
    try {
        const confirmation = await highLowResponse.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 20000 }); // give 20 sec for response
        let msg = `Your number was ${givenNum}, Jeffy was thinking of ${thinkingNum}.`;
        if (confirmation.customId === 'lower') {
            if (thinkingNum < givenNum) {
                await confirmation.update({ content: `Jeff says: MRR!!!!! MRRR...MRRR...MRR!!! (translation: You won! +5 energy! ${msg})`, components: [] });
                user.energy += 5;
            } else {
                await confirmation.update({ content: `Jeff says: Uh-Oh! mrrr....MRRMRR..mrr... (translation: you didn't get it... ${msg})`, components: [] });
            }
        } else if (confirmation.customId === 'higher') {
            if (thinkingNum > givenNum) {
                await confirmation.update({ content: `Jeff says: MRR!!!!! MRRR...MRRR...MRR!!! (translation: You won! +5 energy! ${msg})`, components: [] });
                user.energy += 5;
            } else {
                await confirmation.update({ content: `Jeff says: Uh-Oh! mrrr....MRRMRR..mrr... (translation: you didn't get it... ${msg})`, components: [] });
            }
        } else if (confirmation.customId === 'jackpot') {
            if (givenNum === thinkingNum) {
                await confirmation.update({ contents: `Jeff says: MRR!!!!! MRRR...MRRR...MRR!!! (translation: You won! +100 energy! ${msg})`, components: [] });
                user.energy += 100;
            } else {
                await confirmation.update({ content: `Jeff says: Uh-Oh! mrrr....MRRMRR..mrr... (translation: you didn't get it... ${msg})`, components: [] });
            }
        }
        await user.save(); // saves update user info to db
    } catch {
        await interaction.editReply({ content: 'You left Jeffy alone too long :(( cancelling', flags: MessageFlags.Ephemeral, components: [] });
    }
}




async function playBlackJack(interaction, tbl, user_name, user_id) {
    await interaction.reply("Work in progress...");
    // TODO: USE HIGHLOW FUNCTION FOR HELP
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a game with Jeff!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('highlow')
                .setDescription('Guess if the number Jeff is thinking of is lower or higher, winning gives energy'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('blackjack')
                .setDescription('Bet reputation to play blackjack against Jeff')
                .addIntegerOption(option =>
                    option.setName('bet')
                        .setDescription('Reputation you would like to bet')
                        .setRequired(true))),
    async execute(interaction) {
        const tbl = interaction.client.db.jeff;
        let name;
        try {
            name = interaction.member.displayName;
        }
        catch (err) {
            name = interaction.user.username;
        }
        const id = interaction.user.id;
        if (interaction.options.getSubcommand() === 'highlow') {
            await playHighLow(interaction, tbl, name, id);
        } else {
            await playBlackJack(interaction, tbl, name, id);
        }
    },
};