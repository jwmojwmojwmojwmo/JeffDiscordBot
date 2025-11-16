const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUserAndUpdate } = require('../../utils.js');

// questions stored as "question": "options": "correct option"
const easyQuestions = [
	' got gobbled by Jeff. Chomp chomp! NOM NOM!',
	' was just swallowed by Jeff whole. Slurp slurp!',
	' is now Jeff’s snack. *nomnomnom*',
	' was caught by Jeff in his jaws. Crunch crunch!',
	' vanished... and Jeff’s tummy says thanks! NOMNOM!',
	' got Jeff’ed. Nomfest initiated!',
];

module.exports = {
	cooldown: 7,
	data: new SlashCommandBuilder()
		.setName('quiz')
		.setDescription('Get a question related to Jeff! Win energy by getting it correct!'),
	async execute(interaction) {
        const name = interaction.member?.displayName || interaction.user.username;
        let user = getUserAndUpdate(interaction.client.db.jeff, interaction.user.id, name, false);

	},
};