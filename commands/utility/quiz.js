const { SlashCommandBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserAndUpdate } = require('../../utils.js');
const questions = require('../../quizquestions.js');
// questions stored as "question": "options": "correct option"

const buildButtonRow = (question, answerPlacement, s1, s2, s3, s4, disabledStatus) =>
    new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(question.options[answerPlacement[0]])
            .setLabel(question.options[answerPlacement[0]])
            .setStyle(s1)
            .setDisabled(disabledStatus),
        new ButtonBuilder()
            .setCustomId(question.options[answerPlacement[1]])
            .setLabel(question.options[answerPlacement[1]])
            .setStyle(s2)
            .setDisabled(disabledStatus),
        new ButtonBuilder()
            .setCustomId(question.options[answerPlacement[2]])
            .setLabel(question.options[answerPlacement[2]])
            .setStyle(s3)
            .setDisabled(disabledStatus),
        new ButtonBuilder()
            .setCustomId(question.options[answerPlacement[3]])
            .setLabel(question.options[answerPlacement[3]])
            .setStyle(s4)
            .setDisabled(disabledStatus));

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
        let time = 15;
        if (chosenQuestionBank === 0) {
            difficulty = "Easy";
        } else if (chosenQuestionBank === 1) {
            difficulty = "Medium";
            time = 12;
        } else if (chosenQuestionBank === 2) {
            difficulty = "Hard";
            time = 10;
        } else {
            difficulty = "Extreme";
            time = 8;
        }
        let chosenQuestion = questions[chosenQuestionBank][Math.floor(Math.random() * questions[chosenQuestionBank].length)]; //get a random question from chosen questionbank
        let answerPlacement = [0, 1, 2, 3];
        answerPlacement.sort(() => Math.random() - 0.5); // randomises sorting of answers
        const msg = `You have ${time} seconds to get the following ${difficulty} difficulty question correct!\n\n${chosenQuestion.question}`;
        const question = await interaction.reply({
            content: msg,
            components: [buildButtonRow(chosenQuestion, answerPlacement, ButtonStyle.Secondary, ButtonStyle.Secondary, ButtonStyle.Secondary, ButtonStyle.Secondary, false)],
            withResponse: true
        });
        const collectorFilter = i => i.user.id === interaction.user.id; // check the person who pressed the button is the person who started the interaction
        try {
            const response = await question.resource.message.awaitMessageComponent({ filter: collectorFilter, time: time * 1000 });
            if (response.customId === chosenQuestion.answer) {
                await response.update({
                    content: `${msg}\n\nGood job! You earned +${chosenQuestionBank + 1} energy!`,
                    components: [buildButtonRow(
                        chosenQuestion,
                        answerPlacement,
                        chosenQuestion.options[answerPlacement[0]] === chosenQuestion.answer ? ButtonStyle.Success : ButtonStyle.Secondary,
                        chosenQuestion.options[answerPlacement[1]] === chosenQuestion.answer ? ButtonStyle.Success : ButtonStyle.Secondary,
                        chosenQuestion.options[answerPlacement[2]] === chosenQuestion.answer ? ButtonStyle.Success : ButtonStyle.Secondary,
                        chosenQuestion.options[answerPlacement[3]] === chosenQuestion.answer ? ButtonStyle.Success : ButtonStyle.Secondary,
                        true)]
                });
                console.log(`${user.username} (${user.userid}) won ${chosenQuestionBank + 1} through quiz.`);
                user.energy += chosenQuestionBank + 1;
                await user.save();
            } else {
                await response.update({
                    content: `${msg}\n\nWrong answer! Jeff would not approve.`,
                    components: [buildButtonRow(
                        chosenQuestion,
                        answerPlacement,
                        chosenQuestion.options[answerPlacement[0]] === response.customId ? ButtonStyle.Danger : ButtonStyle.Secondary,
                        chosenQuestion.options[answerPlacement[1]] === response.customId ? ButtonStyle.Danger : ButtonStyle.Secondary,
                        chosenQuestion.options[answerPlacement[2]] === response.customId ? ButtonStyle.Danger : ButtonStyle.Secondary,
                        chosenQuestion.options[answerPlacement[3]] === response.customId ? ButtonStyle.Danger : ButtonStyle.Secondary,
                        true)]
                });
                console.log(`${user.username} (${user.userid}) did not get ${difficulty} quiz question right.`);
            }
        }
        catch (err) { // catch error throw if response exceeds max time given
            console.log(err);
            await interaction.editReply({ content: 'You ran out of time!', components: [] });
        }
    },
};