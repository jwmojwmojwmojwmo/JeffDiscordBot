import { SlashCommandBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { getUserAndUpdate } from '../../helpers/utils.js';
import { setTimeout } from 'node:timers/promises';

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
const hit = new ButtonBuilder()
    .setCustomId('hit')
    .setLabel('Hit')
    .setStyle(ButtonStyle.Primary);

const stand = new ButtonBuilder()
    .setCustomId('stand')
    .setLabel('Stand')
    .setStyle(ButtonStyle.Primary);

const double = new ButtonBuilder()
    .setCustomId('double')
    .setLabel('Double')
    .setStyle(ButtonStyle.Secondary);

const split = new ButtonBuilder()
    .setCustomId('split')
    .setLabel('Split')
    .setStyle(ButtonStyle.Secondary);

const insure = new ButtonBuilder()
    .setCustomId('insure')
    .setLabel('Insurance')
    .setStyle(ButtonStyle.Secondary);

const surrender = new ButtonBuilder()
    .setCustomId('surrender')
    .setLabel('Surrender')
    .setStyle(ButtonStyle.Danger);

const alwaysActions = new ActionRowBuilder().addComponents(hit, stand);
const firstTimes = new ActionRowBuilder().addComponents(double, surrender);
const insureTimes = new ActionRowBuilder().addComponents(insure);


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




async function playBlackJack(interaction, user, bet) {
    let bool = false;
    let time = 120;
    console.log('new game');
    let jeffCards = [];
    let userCards = [];
    let deck = ["A♤", "2♤", "3♤", "4♤", "5♤", "6♤", "7♤", "8♤", "9♤", "J♤", "Q♤", "K♤", "10♤",
                "A♢", "2♢", "3♢", "4♢", "5♢", "6♢", "7♢", "8♢", "9♢", "J♢", "Q♢", "K♢", "10♢",
                "A♧", "2♧", "3♧", "4♧", "5♧", "6♧", "7♧", "8♧", "9♧", "J♧", "Q♧", "K♧", "10♧",
                "A♡", "2♡", "3♡", "4♡", "5♡", "6♡", "7♡", "8♡", "9♡", "J♡", "Q♡", "K♡", "10♡"]; //emoticon
    //let deck = ["A♤", "Q♤", "A♤", "A♤"]

    let jeffySum = 0;
    let userSum = 0;
    // shuffles deck
    deck = fisherYates(deck);


    // give cards
    let result = drawCard(deck, jeffCards);
    deck = result.deck;
    jeffCards = result.hand;
    
    result = drawCard(deck, jeffCards);
    deck = result.deck;
    jeffCards = result.hand;

    result = drawCard(deck, userCards);
    deck = result.deck;
    userCards = result.hand;

    result = drawCard(deck, userCards);
    deck = result.deck;
    userCards = result.hand;

    jeffySum = sum(jeffCards);
    userSum = sum(userCards);

    let message = '';
    const Embeds = () =>
        new EmbedBuilder()
            .setTitle(`${user.username}'s Blackjack Game`)
            .addFields(
                {
                    name: `Bet Amount ${bet}`,
                    value: ``
                },
                {
                    name: `Jeffy`,
                    value: `Cards: ${jeffCards}\nSum: ${jeffySum}`
                },
                {
                    name: `${user.username}`,
                    value: `Cards: ${userCards}\nSum: ${userSum}`
                },
                {
                    name: ``,
                    value: `${message} ${bet} energy!`
                }
            );







    // if (sum(jeffCards[0])) {

    // }
    //for insurance

    if (jeffySum == 21) {
        if (userSum == 21) {
            message = 'Push, you got your bet of';
            await interaction.reply({
                embeds: [Embeds()],
                components: []
            });
            return;
        } else {
            message = 'You lost... Jeff had a blackjack. You lost';
            await interaction.reply({
                embeds: [Embeds()],
                components: []
            });
            user.energy -= bet;
            await user.save();
            return;
        }
    } else if (userSum == 21) {
        message = 'You got a blackjack and won! You gained';
        await interaction.reply({
            embeds: [Embeds()],
            components: []
        });
        user.energy += bet;
        await user.save();
        return;
    }
    
    //starting deck show
    let startNum = sum(jeffCards.slice(0, 1))
    const startEmbed = () =>
        new EmbedBuilder()
            .setTitle(`${user.username}'s Blackjack Game`)
            .addFields(
                {
                    name: `Bet Amount ${bet}`,
                    value: ``
                },
                {
                    name: `Jeffy`,
                    value: `Cards: ${jeffCards[0]},??\nSum: ${startNum}`
                },
                {
                    name: `${user.username}`,
                    value: `Cards: ${userCards}\nSum: ${userSum}`
                }
            );


    //show decks
    //hi jason

    const buildEmbed = () =>
        new EmbedBuilder()
            .setTitle(`${user.username}'s Blackjack Game`)
            .addFields(
                {
                    name: `Bet Amount ${bet}`,
                    value: ``
                },
                {
                    name: `Jeffy`,
                    value: `Cards: ${jeffCards}\nSum: ${jeffySum}`
                },
                {
                    name: `${user.username}`,
                    value: `Cards: ${userCards}\nSum: ${userSum}`
                }
            );

    

    // initial reply
    const reply = await interaction.reply({
        embeds: [startEmbed()],
        components: [alwaysActions, firstTimes],
    }); 
    

    // returns true if the user pressing the button is the user who started the interaction
    const collectorFilter = i => i.user.id === interaction.user.id; 
    
    // creates a collector, lasting for two minutes, using the filter, that 'collects' every time an action is performed
    const collector = reply.createMessageComponentCollector({ 
        filter: collectorFilter,
        time: 120_000, // 2 minutes
    });

    collector.on('collect', async i => {
        await i.deferUpdate();
        console.log(i.customId);
        if (bool === true) {

            return;
            
        }
        bool = true;

        console.log(i.customId);
        if (i.customId === 'hit') {

            //grab card and put in user's hand
            result = drawCard(deck, userCards);
            deck = result.deck;
            userCards = result.hand;
            userSum = sum(userCards);
            console.log('ow');
            if (userSum > 21) {
                message = 'You lost... You lost';
                await i.editReply({
                    embeds: [Embeds()],
                    components: []
                });
                user.energy -= bet;
                await user.save();
                collector.stop('end');
            } else if (userSum === 21) {
                await i.editReply({
                    embeds: [buildEmbed()],
                    components: []
                    });
                while (jeffySum <= 16) {
                    result = drawCard(deck, jeffCards);
                    deck = result.deck;
                    jeffCards = result.hand;
                    jeffySum = sum(jeffCards);
                    await i.editReply({
                        embeds: [buildEmbed()],
                        components: [alwaysActions]
                        });
                    await setTimeout(time);
                }
    
                if (jeffySum > 21) {
                    message = 'You won! You gained';
                    await i.editReply({
                        embeds: [Embeds()],
                        components: []
                    });
                    user.energy += bet;
                    await user.save();
                    collector.stop('end');
                } else if (jeffySum > userSum) {
                    message = 'You lost... You lost';
                    await i.editReply({
                        embeds: [Embeds()],
                        components: []
                    });
                    user.energy -= bet;
                    await user.save();
                    collector.stop('end');
                } else if (jeffySum < userSum) {
                    message = 'You won! You gained';
                    await i.editReply({
                        embeds: [Embeds()],
                        components: []
                    });
                    user.energy += bet;
                    await user.save();
                    collector.stop('end');
                } else {
                    message = 'Push, you got your bet of';
                    await i.editReply({
                        embeds: [Embeds()],
                        components: []
                    });
                }
                bool = false;
                return;
            } else {
                await i.editReply({
                embeds: [startEmbed()],
                components: [alwaysActions]
                });
            }
            
        }

        if (i.customId === 'stand') {
            console.log('build');
            await i.editReply({
                embeds: [buildEmbed()],
                components: []
            });
            while (jeffySum <= 16) {
                result = drawCard(deck, jeffCards);
                deck = result.deck;
                jeffCards = result.hand;
                jeffySum = sum(jeffCards);
                await i.editReply({
                    embeds: [buildEmbed()],
                    components: [alwaysActions]
                    });
                await setTimeout(time);
            }

            if (jeffySum > 21) {
                message = 'You won! You gained';
                await i.editReply({
                    embeds: [Embeds()],
                    components: []
                });
                user.energy += bet;
                console.log('yay');
                await user.save();
                collector.stop('end');
                console.log('stopped');
            } else if (jeffySum > userSum) {
                message = 'You lost... You lost';
                await i.editReply({
                    embeds: [Embeds()],
                    components: []
                });
                user.energy -= bet;
                console.log('sad');
                await user.save();
                collector.stop('end');
            } else if (jeffySum < userSum) {
                message = 'You won! You gained';
                await i.editReply({
                    embeds: [Embeds()],
                    components: []
                });
                console.log('yays');
                user.energy += bet;
                await user.save();
                collector.stop('end');
            } else {
                message = 'Push, you got your bet of';
                await i.editReply({
                    embeds: [Embeds()],
                    components: []
                });
                collector.stop('end');
            }
            console.log('got here');
            bool = false;
            return;
            
        }
        console.log('hm?');

        if (i.customId === 'double') {
            bet = bet * 2;
            result = drawCard(deck, userCards);
            deck = result.deck;
            userCards = result.hand;
            userSum = sum(userCards);

            if (userSum > 21) {
                message = 'You lost... You lost';
                await i.editReply({
                    embeds: [Embeds()],
                    components: []
                });
                user.energy -= bet;
                await user.save();
                collector.stop('end');
            } else {
                await i.editReply({
                    embeds: [buildEmbed()],
                    components: [alwaysActions]
                    });
                while (jeffySum <= 16) {
                    result = drawCard(deck, jeffCards);
                    deck = result.deck;
                    jeffCards = result.hand;
                    jeffySum = sum(jeffCards);
                    await i.editReply({
                        embeds: [buildEmbed()],
                        components: [alwaysActions]
                        });
                    await setTimeout(time);
                }
    
                if (jeffySum > 21) {
                    message = 'You won! You gained';
                    await i.editReply({
                        embeds: [Embeds()],
                        components: []
                    });
                    user.energy += bet;
                    await user.save();
                    collector.stop('end');
                } else if (jeffySum > userSum) {
                    message = 'You lost... You lost';
                    await i.editReply({
                        embeds: [Embeds()],
                        components: []
                    });
                    user.energy -= bet;
                    await user.save();
                    collector.stop('end');
                } else if (jeffySum < userSum) {
                    message = 'You won! You gained';
                    await i.editReply({
                        embeds: [Embeds()],
                        components: []
                    });
                    user.energy += bet;
                    await user.save();
                    collector.stop('end');
                } else {
                    message = 'Push, you got your bet of';
                    await i.editReply({
                        embeds: [Embeds()],
                        components: []
                    });
                }
                bool = false;
                return;
            }
        }

        if (i.customId === 'surrender') {
            bet = Math.floor(bet / 2);
            message = 'You surrendered. You lost';
            await i.editReply({
                embeds: [Embeds()],
                components: []
            });
            console.log('bleh');
            user.energy -= bet;
            await user.save();
            collector.stop('end');
        }

        // if (i.customId === 'split') {
        //     let userCards2 = userCards.slice(1, 2);
        //     userCards = userCards.slice(0, 1);
        //     // do the hit and stand stuff for each
        // }

        // if (i.customId === 'insure') {
        //     //do insure stuff
        //     if (jeffySum === 21) {
        //         user.energy = (bet / 2) * 2;
        //         return;
        //         //do i lose og bet after i win?
        //     } else {
        //         user.energy -= bet / 2;

        //         //hit stand stuff
        //     }

        //     await i.update({
        //         embeds: [buildEmbed()],
        //         components: [alwaysActions]
        //     });
        //     while (jeffySum <= 16) {
        //         result = drawCard(deck, jeffCards);
        //         deck = result.deck;
        //         jeffCards = result.hand;
        //         jeffySum = sum(jeffCards);
        //         await i.editReply({
        //             embeds: [buildEmbed()],
        //             components: [alwaysActions]
        //             });
        //     }

        //     if (jeffySum > 21) {
        //         await i.editReply({
        //             embeds: [winEmbed()],
        //             components: []
        //         });
        //         user.energy += bet;
        //         console.log('yay');
        //         await user.save();
        //     } else if (jeffySum > userSum) {
        //         await i.editReply({
        //             embeds: [loseEmbed()],
        //             components: []
        //         });
        //         user.energy -= bet;
        //         console.log('sad');
        //         await user.save();
        //     } else if (jeffySum < userSum) {
        //         await i.editReply({
        //             embeds: [winEmbed()],
        //             components: []
        //         });
        //         console.log('yay');
        //         user.energy += bet;
        //         await user.save();
        //     } else {
        //         await i.editReply({
        //             embeds: [pushEmbed()],
        //             components: []
        //         });
        //     }

        //     return;
        // }



        bool = false;
    });
    



    


    



    

    
    bool = false;
    
    console.log('how');

    
    collector.on('end', async (_collected, reason) => { // pass reason for ending collector with collector.stop(reason)
        try {
            if (reason === 'end')
                return;
            console.log('huh');
            await interaction.editReply({
                content: 'This interaction timed out.',
                components: [],
                embeds: [],
                flags: MessageFlags.Ephemeral,
            });
            console.log('what');
        } catch (exceptioncuzimfancy) {
            console.error(exceptioncuzimfancy);
        }
        // use interaction.editreply for final edit, use i.update otherwise
    })
}

function fisherYates(deck) {
    for (let i = 0; i < deck.length - 1; i++) {
      const j = Math.floor(Math.random() * (deck.length - i)) + i;
      let temp = deck[i];
      deck[i] = deck[j];
      deck[j] = temp;
    }
    return deck;
  };

function drawCard(deck, hand) {
    let randomNum = Math.floor(Math.random() * deck.length);
    let card = deck[randomNum];
    deck.splice(randomNum, 1)
    hand.push(card);
    console.log(hand);
    return {
        hand: hand,
        deck: deck
    }
}

function sum(deck) {
    let sum = 0;
    let tens = ['J', 'Q', 'K'];
    let aces = 0;
    for (let i = 0; i < deck.length; i++) {

        if (tens.includes(deck[i].substring(0, deck[i].length - 1))) {
            sum = sum + 10;
        } else if (deck[i].substring(0, deck[i].length - 1) === 'A') {
            aces++;
            sum = sum + 11;
        } else {
            sum = sum + Number(deck[i].substring(0, deck[i].length - 1));
        }
        
    }

    while (sum > 21 && aces > 0) {
        sum = sum - 10;
        aces = aces - 1;
    }
    console.log(sum);
    return sum;
}

// function standing(??) {
//     await i.update({
//         embeds: [buildEmbed()],
//         components: [alwaysActions]
//     });
//     while (jeffySum <= 16) {
//         result = drawCard(deck, jeffCards);
//         deck = result.deck;
//         jeffCards = result.hand;
//         jeffySum = sum(jeffCards);
//         await i.editReply({
//             embeds: [buildEmbed()],
//             components: [alwaysActions]
//             });
//     }

//     if (jeffySum > 21) {
//         await i.editReply({
//             embeds: [winEmbed()],
//             components: []
//         });
//         user.energy += bet;
//         console.log('yay');
//         await user.save();
//     } else if (jeffySum > userSum) {
//         await i.editReply({
//             embeds: [loseEmbed()],
//             components: []
//         });
//         user.energy -= bet;
//         console.log('sad');
//         await user.save();
//     } else if (jeffySum < userSum) {
//         await i.editReply({
//             embeds: [winEmbed()],
//             components: []
//         });
//         console.log('yay');
//         user.energy += bet;
//         await user.save();
//     } else {
//         await i.editReply({
//             embeds: [pushEmbed()],
//             components: []
//         });
//     }

//     return;
// }



export const cooldown = 0;
export const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a game with Jeff!')
    .addSubcommand(subcommand => subcommand
        .setName('highlow')
        .setDescription('Guess if the number Jeff is thinking of is lower or higher, winning gives energy'))
    .addSubcommand(subcommand => subcommand
        .setName('blackjack')
        .setDescription('Bet reputation to play blackjack against Jeff')
        .addIntegerOption(option => option.setName('bet')
            .setDescription('Reputation you would like to bet')
            .setRequired(true)));
export async function execute(interaction) {
    const tbl = interaction.client.db.jeff;
    const name = interaction.member?.displayName || interaction.user.username;
    const id = interaction.user.id;
    if (interaction.options.getSubcommand() === 'highlow') {
        await playHighLow(interaction, tbl, id, name);
    }
    else {
        const user = await getUserAndUpdate(tbl, id, name, false);
        // TODO: ensure getInteger('bet') returns a positive integer that is not higher than user's current energy
        await playBlackJack(interaction, user, interaction.options.getInteger('bet'));
    }
}