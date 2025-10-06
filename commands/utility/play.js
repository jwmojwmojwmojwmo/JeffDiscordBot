const { SlashCommandBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

// constants for highLow UI
const lowerButton = new ButtonBuilder()
    .setCustomId('lower')
    .setLabel('Lower')
    .setStyle(ButtonStyle.Secondary); // button styles: Primary => blue button, Secondary => Gray button, Success => Green button, Danger => Red button
const higherButton = new ButtonBuilder()
    .setCustomId('higher')
    .setLabel('Higher')
    .setStyle(ButtonStyle.Secondary);
const jackpotButton = new ButtonBuilder()
    .setCustomId('jackpot')
    .setLabel('Jackpot')
    .setStyle(ButtonStyle.Primary);
const highLowRow = new ActionRowBuilder().addComponents(lowerButton, jackpotButton, higherButton); // the row of buttons below the text

// TODO: constants for blackjack UI


// TODO: dynamic scoring system
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
        const confirmation = await highLowResponse.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 20000 }); // give 20 sec for response before erroring
        let msg = `Your number was ${givenNum}, Jeffy was thinking of ${thinkingNum}.`;
        if ((confirmation.customId === 'lower' && thinkingNum < givenNum) || (confirmation.customId === 'higher' && thinkingNum > givenNum) || (confirmation.customId === 'jackpot' && givenNum === thinkingNum)) {
            let reward = getHighLowReward(Math.abs(givenNum - thinkingNum));
            await confirmation.update({ content: `Jeff says: MRR!!!!! MRRR...MRRR...MRR!!! (translation: You won! +${reward} energy! ${msg})`, components: [] });
            user.energy += reward;
        } else {
            let penalty = getHighLowPenalty(Math.abs(givenNum - thinkingNum));
            await confirmation.update({ content: `Jeff says: Uh-Oh! mrrr....MRRMRR..mrr... (translation: you didn't get it... -${penalty} energy. ${msg})`, components: [] });
        }
        await user.save(); // saves update user info to db
    } catch { // catch error throw if response exceeds 20 sec
        await interaction.editReply({ content: 'You left Jeffy alone too long :(( cancelling', flags: MessageFlags.Ephemeral, components: [] });
    }
}

function getHighLowReward(diff) {
    if (diff === 0) {
        return 100;
    }
    if (diff >= 50) {
        return 5;
    }
    return Math.round(20 - (diff - 1) * (15 / 49)); // scales linearly from 20 to 5 as diff goes from 1 to 50
}

function getHighLowPenalty(diff) {
    if (diff === 0) {
        return 2;
    }
    if (diff >= 50) {
        return 20;
    }
    return Math.round(2 + (18 / 49) * diff); // scales linearly from 2 to 20 as diff goes from 1 to 50
}

async function playBlackJack(interaction, tbl, user_name, user_id) {

    // stub for db
    let user = await tbl.findByPk(user_id);
    if (user) {
        user.username = user_name;
    }
    else {
        user = await tbl.create({
            userid: user_id,
            username: user_name,
        });
        console.log('New user created:', user.toJSON());
    }

    // TODO: implement blackjack, see highlow function for help

    await interaction.reply("Work in progress..."); // comment out when blackjack is done
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