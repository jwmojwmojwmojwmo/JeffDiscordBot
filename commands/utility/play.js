const { SlashCommandBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { getUserAndUpdate } = require('../../utils.js');

// TODO: constants for highLow scoring

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

async function playHighLow(interaction, tbl, user_id, user_name) {
    const thinkingNum = Math.floor(Math.random() * 101); // the num jeffy is thinking of, 0-100
    const givenNum = Math.floor(Math.random() * 101); // the num the user sees, 0-100
    const highLowReply = await interaction.reply({
        content: `Jeff says: MRR!!! MRRRR MRR!! YUMMY YUMMY! (translation: I'm thinking of a number from 0-100! Is it lower or higher than ${givenNum}?)\nUse Jackpot if you think they're the same number!`,
        components: [highLowRow],
        withResponse: true,
    });
    let user = await getUserAndUpdate(tbl, user_id, user_name, false);
    const collectorFilter = i => i.user.id === interaction.user.id; // check the person who pressed the button is the person who started the interaction
    try {
        const response = await highLowReply.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 20000 }); // give 20 sec for response before erroring
        const msg = `Your number was ${givenNum}, Jeffy was thinking of ${thinkingNum}.`;
        if ((response.customId === 'lower' && thinkingNum < givenNum) || (response.customId === 'higher' && thinkingNum > givenNum) || (response.customId === 'jackpot' && givenNum === thinkingNum)) {
            const reward = (thinkingNum === givenNum) ? 500 : getHighLowReward(Math.abs(givenNum - 50));
            await response.update({ content: `Jeff says: MRR!!!!! MRRR...MRRR...MRR!!! (translation: You won! +${reward} energy! ${msg})`, components: [] });
            user.energy += reward;
            console.log(`${user.username} (${user.userid}) won ${reward} through highlow.`);
        }
        else {
            const penalty = (response.customId === 'jackpot') ? 1 : getHighLowPenalty(Math.abs(givenNum - 50));
            await response.update({ content: `Jeff says: Uh-Oh! mrrr....MRRMRR..mrr... (translation: you didn't get it... -${penalty} energy. ${msg})`, components: [] });
            user.energy -= penalty;
            console.log(`${user.username} (${user.userid}) lost ${penalty} through highlow.`);
        }
        await user.save(); // saves update user info to db
    }
    catch { // catch error throw if response exceeds 20 sec
        await interaction.editReply({ content: 'You left Jeffy alone too long :(( cancelling', flags: MessageFlags.Ephemeral, components: [] });
    }
}

function getHighLowReward(diff) {
    const maxReward = 10;
    const minReward = 2;
    const maxDiff = 50;
    const exponent = 2; // control steepness
    return Math.round(minReward + Math.pow(1 - diff / maxDiff, exponent) * (maxReward - minReward)); // exponentially goes from 2 - 10 as givenNum gets closer to 50
}
// NOTE: expected value for reward + penalty, assuming optimal play, is around + 2 energy (the house does NOT always win)
function getHighLowPenalty(diff) {
    const maxPenalty = 18;
    const minPenalty = 3;
    const maxDiff = 50;
    const exponent = 2;
    return Math.round(minPenalty + Math.pow(diff / maxDiff, exponent) * (maxPenalty - minPenalty)); // exponentially goes from 18 - 3 as givenNum gets closer to 50
}


async function playBlackJack(interaction, tbl, user_id, user_name, bet) {
    console.log(`${user_name} (${user_id}) tried to play blackjack.`);
    return interaction.reply('Work in progress...'); // comment out when blackjack is done

    // stub
    const reply = await interaction.reply('stub'); // initial reply
    const user = await getUserAndUpdate(tbl, user_id, user_name, false); // returns user who started interaction
    const collectorFilter = i => i.user.id === interaction.user.id; // returns true if the user pressing the button is the user who started the interaction
    const collector = reply.createMessageComponentCollector({ // creates a collector, lasting for two minutes, using the filter, that 'collects' every time an action is performed
        filter: collectorFilter,
        time: 120_000, // 2 minutes
    });
    collector.on('collect', async i => { // runs whenever a button is pressed
        // perform some action
        await user.save(); // saves user information to db, try to reduce calls to this whenevere possible
        await i.update('stub'); // updates the message panel from the initial reply
    });
    collector.on('end', async () => { // runs once when time is over
        await interaction.editReply('You left Jeffy alone too long :(( cancelling'); // use interaction.editReply() for the final edit, use i.update() otherwise
    })
    // TODO: implement blackjack, see highlow function for help, see settings command for more help
}

module.exports = {
    cooldown: 7,
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
        const name = interaction.member?.displayName || interaction.user.username;
        const id = interaction.user.id;
        if (interaction.options.getSubcommand() === 'highlow') {
            await playHighLow(interaction, tbl, id, name);
        }
        else {
            // TODO: ensure getInteger('bet') returns a positive integer that is not higher than user's current reputation
            await playBlackJack(interaction, tbl, id, name, interaction.options.getInteger('bet'));
        }
    },
};