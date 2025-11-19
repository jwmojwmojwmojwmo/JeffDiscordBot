const { SlashCommandBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserAndUpdate } = require('../../utils.js');

// questions stored as "question": "options": "correct option"
const easyQuestions = [
    {
        question: "What is Jeff's role in Marvel Rivals?",
        options: ["Vanguard", "Duelist", "Support", "Strategist"],
        answer: "Strategist"
    },
    {
        question: "How much health does Jeff have in Marvel Rivals?",
        options: ["250", "275", "300", "325"],
        answer: "250"
    },
    {
        question: "Jeff first appears (unnamed) in which comic series?",
        options: ["Avengers", "West Coast Avengers (vol. 3)", "X-Men", "Guardians of the Galaxy"],
        answer: "West Coast Avengers (vol. 3)"
    },
    {
        question: "Jeff was named and formally introduced in which comic series?",
        options: ["Avengers", "West Coast Avengers (vol. 3)", "West Coast Avengers (vol. 4)", "Guardians of the Galaxy"],
        answer: "West Coast Avengers (vol. 3)"
    },
    {
        question: "What does Jeff's passive do in Marvel Rivals?",
        options: ["Reduce critical hits damage", "Reduce all damage", "Give him wall climb ability", "Provide passive self-healing"],
        answer: "Reduce critical hits damage"
    },
    {
        question: "What animal does Jeff resemble?",
        options: ["Dolphin", "Shark puppy", "Seal", "Crocodile"],
        answer: "Shark puppy"
    },
    {
        question: "What is the name of Jeff's ultimate in Marvel Rivals?",
        options: ["Shark Frenzy", "It's Jeff!", "Mega Splash", "Tidal Chomp"],
        answer: "It's Jeff!"
    },
    {
        question: "What does Jeff eat in the comics?",
        options: ["Mostly metal", "Anything he wants", "Almost always fish", "Only pizza"],
        answer: "Anything he wants"
    },
    {
        question: "Who is one of Jeff's caretakers in the comics?",
        options: ["Captain Marvel", "Gwenpool", "Thor", "She-Hulk"],
        answer: "Gwenpool"
    },
    {
        question: "What does Jeff's 'Aqua Burst' do in Marvel Rivals?",
        options: ["Deals splash and projectile damage", "Deals splash damage only", "Heals allies", "Makes Jeff dive underwater"],
        answer: "Deals splash and projectile damage"
    },
];

const medQuestions = [
    {
        question: "Jeff leaves a healing pool after using his ultimate in Marvel Rivals. How long does this pool last?",
        options: ["4 seconds", "6 seconds", "8 seconds", "10 seconds"],
        answer: "8 seconds"
    },
    {
        question: "How many charges can Jeff store for his 'Aqua Burst' ability?",
        options: ["1", "2", "3", "4"],
        answer: "3"
    },
    {
        question: "Jeff heals how much HP per second while underwater in Marvel Rivals?",
        options: ["15 HP/s", "25 HP/s", "35 HP/s", "30 HP/s"],
        answer: "35 HP/s"
    },
    {
        question: "Which character originally adopted Jeff in the comics?",
        options: ["Kate Bishop", "Gwenpool", "America Chavez", "Squirrel Girl"],
        answer: "Gwenpool"
    },
    {
        question: "Which hero has Jeff NEVER had a team up with in Marvel Rivals?",
        options: ["Venom", "Luna Snow", "Rocket Raccoon", "Storm"],
        answer: "Rocket Raccoon"
    },
    {
        question: "How much healing does Jeff's 'Joyful Splash' do in Marvel Rivals to allies?",
        options: ["100/s", "120/s", "130/s", "150/s"],
        answer: "130/s"
    },
    {
        question: "How much ammo does Jeff's 'Joyful Splash' have in Marvel Rivals?",
        options: ["80", "90", "100", "120"],
        answer: "100"
    },
    {
        question: "Jeff has appeared in which Gwenpool series?",
        options: ["Gwenpool Strikes Back", "Gwenpool Takes Manhattan", "The Unbelievable Gwenpool", "Gwenpool Special #1"],
        answer: "Gwenpool Strikes Back"
    },
    {
        question: "How long does Jeff's 'Healing Bubble' grant movement speed boost for?",
        options: ["2s", "3s", "4s", "5s"],
        answer: "4s"
    },
    {
        question: "In Marvel Comics lore, who is credited with creating the Landshark species, including Jeff?",
        options: ["MODOK", "Roxxon Scientists", "Hydra", "S.H.I.E.L.D."],
        answer: "MODOK"
    },
    {
        question: "Who voices Jeff the Landshark in Marvel Rivals?",
        options: ["Jon Bailey", "Troy Baker", "Josh Keaton", "Yuri Lowenthal"],
        answer: "Jon Bailey"
    }
];

const hardQuestions = [
    {
        question: "In Marvel Comics, why were the Landsharks originally created?",
        options: ["To attack Santa Monica", "To defend a secret base", "For underwater infiltration missions", "because of hybrid animal experiments"],
        answer: "To attack Santa Monica"
    },
    {
        question: "What is the projectile speed of Jeff's Joyful Splash?",
        options: ["100m/s", "110m/s", "130m/s", "80m/s"],
        answer: "100m/s"
    },
    {
        question: "How much damage reduction does Jeff get when riding on Groot's shoulders?",
        options: ["30%", "35%", "25%", "40%"],
        answer: "35%"
    },
    {
        question: "Where was Jeff held captive before escaping in Marvel Rivals lore?",
        options: ["A.I.M. lab", "Collector's Theme Park", "Roxxon headquarters", "S.H.I.E.L.D. facility"],
        answer: "Collector's Theme Park"
    },
    {
        question: "In his Marvel Rivals backstory, how far did Jeff grow after swallowing the Pym Particles?",
        options: ["Twice his size", "Five times his size", "Ten times his size", "Fifteen times his size"],
        answer: "Ten times his size"
    },
    {
        question: "How many Healing Bubbles can Jeff have on the map at once in Marvel Rivals?",
        options: ["3", "4", "5", "6"],
        answer: "5"
    },
    {
        question: "How much energy does Jeff the Baby Land Shark cost in Marvel Snap?",
        options: ["2", "3", "4", "5"],
        answer: "2"
    },
    {
        question: "Which character has NEVER been shown caring for Jeff in any comic or Marvel digital short?",
        options: ["Kate Bishop", "Kamala Khan", "Deadpool", "America Chavez"],
        answer: "America Chavez"
    },
    {
        question: "What is the maximum range Jeff can activate 'It's Jeff-Nado!' from?",
        options: ["40m", "50m", "60m", "70m"],
        answer: "60m"
    },
    {
        question: "Who created Jeff the Landshark?",
        options: ["Kelly Thompson & Daniele Di Nicuolo", "Kelly Thompson & Gurihiru", "Kelly Thompson & David López", "Kelly Thompson & Leonardo Romero"],
        answer: "Kelly Thompson & Daniele Di Nicuolo"
    },
    {
        question: "How much healing does Jeff's ultimate do to swallowed allies?",
        options: ["125/s", "100/s", "200/s", "225/s"],
        answer: "225/s"
    },
];

const extremeQuestions = [
    {
        question: "How much damage does Jeff's 'Joyful Splash' do from 40m and farther?",
        options: ["50.5/s", "45.5/s", "40.5/s", "55.5/s"],
        answer: "45.5/s"
    },
    {
        question: "How long can Jeff stall his ultimate for? (ie. Pressing the ult button but not going underwater, effectively keeping him in place stuck in the dive animation)",
        options: ["2s", "3s", "5s", "Unlimited"],
        answer: "3s"
    },
    {
        question: "In which issue of It's Jeff does Jeff inhale a full wheel of cheese?",
        options: ["Issue #27", "Issue #37", "Issue #38", "Issue #28"],
        answer: "Issue #38"
    },
    {
        question: "In which issue of It's Jeff does Jeff hide in a dishwasher?",
        options: ["Issue #26", "Issue #36", "Issue #38", "Issue #28"],
        answer: "Issue #26"
    },
    {
        question: "About how tall is the Jeff Funko Pop's vinyl bobblehead?",
        options: ["3 inches (8 cm)", "4.00 inches (10.0 cm)", "3.50 inches (9.0 cm)", "4.25 inches (10.75 cm)"],
        answer: "3 inches (8 cm)"
    },
    {
        question: "In Marvel Rivals, heroes may have a unique voiceline when witnessing a specific ally eliminate an enemy or witnessing them die."
            + "Which hero does Jeff NOT have a voiceline for when witnessing their death or KO?",
        options: ["Emma Frost", "Psylocke", "Namor", "Mantis"],
        answer: "Emma Frost"
    },
    {
        question: "In Marvel Rivals, which hero canonically thinks Jeff is a great singer?",
        options: ["Star-Lord", "Luna Snow", "Rocket", "Mantis"],
        answer: "Star-Lord"
    },
    {
        question: "What has Jeff canonically never swallowed before in the comics?",
        options: ["The Infinity Gauntlet", "A license plate", "An apple", "An arrow"],
        answer: "An arrow"
    },
    {
        question: "In Marvel Rivals, how many nameplates of Jeff were there before Season 5?",
        options: ["5", "6", "7", "4"],
        answer: "6"
    },
    {
        question: "In Jeff's Marvel Rivals Character Reveal Teaser, how many seconds is Jeff seen on screen, excluding the end photo where he is seen with Thor?",
        options: ["29", "36", "27", "33"],
        answer: "33"
    },
    {
        question: "How long is Marvel Entertainment's video titled 'Jeff the Land Shark Marvel's Cutest Hero | Marvel Recap, in seconds?'",
        options: ["1456", "1279", "985", "1397"],
        answer: "1456"
    },
];

const questions = [easyQuestions, medQuestions, hardQuestions, extremeQuestions];

//TODO: clean code, embeds
module.exports = {
    cooldown: 7,
    data: new SlashCommandBuilder()
        .setName('quiz')
        .setDescription('Get a question related to Jeff! Win energy by getting it correct!'),
    async execute(interaction) {
        const name = interaction.member?.displayName || interaction.user.username;
        let user = await getUserAndUpdate(interaction.client.db.jeff, interaction.user.id, name, false);
        let chosenQuestionBank = Math.floor(Math.random() * 4); // choose a random question bank from questions
        let difficulty;
        let time;
        if (chosenQuestionBank === 0) {
            difficulty = "Easy";
            time = 15;
        } else if (chosenQuestionBank === 1) {
            difficulty = "Medium";
            time = 15;
        } else if (chosenQuestionBank === 2) {
            difficulty = "Hard";
            time = 12;
        } else {
            difficulty = "Extreme";
            time = 10;
        }
        let chosenQuestion = questions[chosenQuestionBank][Math.floor(Math.random() * questions[chosenQuestionBank].length)]; //get a random question from chosen questionbank
        let answerPlacement = [0, 1, 2, 3];
        answerPlacement.sort(() => Math.random() - 0.5); // randomises sorting of answers
        const msg = `You have ${time} seconds to get the following ${difficulty} difficulty question correct!\n\n${chosenQuestion.question}`;
        const question = await interaction.reply({
            content: msg,
            components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(chosenQuestion.options[answerPlacement[0]])
                    .setLabel(chosenQuestion.options[answerPlacement[0]])
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(chosenQuestion.options[answerPlacement[1]])
                    .setLabel(chosenQuestion.options[answerPlacement[1]])
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(chosenQuestion.options[answerPlacement[2]])
                    .setLabel(chosenQuestion.options[answerPlacement[2]])
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(chosenQuestion.options[answerPlacement[3]])
                    .setLabel(chosenQuestion.options[answerPlacement[3]])
                    .setStyle(ButtonStyle.Secondary))],
            withResponse: true
        });
        const collectorFilter = i => i.user.id === interaction.user.id; // check the person who pressed the button is the person who started the interaction
        try {
            const response = await question.resource.message.awaitMessageComponent({ filter: collectorFilter, time: time * 1000 });
            if (response.customId === chosenQuestion.answer) {
                await response.update({
                    content: `${msg}\n\nGood job! You earned +${chosenQuestionBank} energy!`,
                    components: [new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(chosenQuestion.options[answerPlacement[0]])
                            .setLabel(chosenQuestion.options[answerPlacement[0]])
                            .setStyle(chosenQuestion.options[answerPlacement[0]] === chosenQuestion.answer ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId(chosenQuestion.options[answerPlacement[1]])
                            .setLabel(chosenQuestion.options[answerPlacement[1]])
                            .setStyle(chosenQuestion.options[answerPlacement[1]] === chosenQuestion.answer ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId(chosenQuestion.options[answerPlacement[2]])
                            .setLabel(chosenQuestion.options[answerPlacement[2]])
                            .setStyle(chosenQuestion.options[answerPlacement[2]] === chosenQuestion.answer ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId(chosenQuestion.options[answerPlacement[3]])
                            .setLabel(chosenQuestion.options[answerPlacement[3]])
                            .setStyle(chosenQuestion.options[answerPlacement[3]] === chosenQuestion.answer ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(true))]
                });
                user.energy += chosenQuestionBank;
                await user.save();
            } else {
                await response.update({
                    content: `${msg}\n\nWrong answer! Jeff would not approve.`,
                    components: [new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(chosenQuestion.options[answerPlacement[0]])
                            .setLabel(chosenQuestion.options[answerPlacement[0]])
                            .setStyle(chosenQuestion.options[answerPlacement[0]] === response.customId ? ButtonStyle.Danger : ButtonStyle.Secondary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId(chosenQuestion.options[answerPlacement[1]])
                            .setLabel(chosenQuestion.options[answerPlacement[1]])
                            .setStyle(chosenQuestion.options[answerPlacement[1]] === response.customId ? ButtonStyle.Danger : ButtonStyle.Secondary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId(chosenQuestion.options[answerPlacement[2]])
                            .setLabel(chosenQuestion.options[answerPlacement[2]])
                            .setStyle(chosenQuestion.options[answerPlacement[2]] === response.customId ? ButtonStyle.Danger : ButtonStyle.Secondary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId(chosenQuestion.options[answerPlacement[3]])
                            .setLabel(chosenQuestion.options[answerPlacement[3]])
                            .setStyle(chosenQuestion.options[answerPlacement[3]] === response.customId ? ButtonStyle.Danger : ButtonStyle.Secondary)
                            .setDisabled(true))]
                });
            }
        }
        catch (err) { // catch error throw if response exceeds max time given
            console.log(err);
            await interaction.editReply({ content: 'You ran out of time!', components: [] });
        }
    },
};