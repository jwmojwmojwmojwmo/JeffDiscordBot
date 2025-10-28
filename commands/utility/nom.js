const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUserAndUpdate } = require('../../utils.js');
const killMsg = [
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
		.setName('nom')
		.setDescription('Nom somebody with Jeff')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('Who you want to nom?')
				.setRequired(true)),
	async execute(interaction) {
		if (!interaction.guild) {
			return interaction.reply({ content: 'This command can\'t be used in DMs.', flags: MessageFlags.Ephemeral });
		}
        const victim_id = interaction.options.getUser('user').id;
        const victim_name = interaction.options.getMember('user').displayName;
		if (victim_id === interaction.user.id) {
			return interaction.reply({ content: 'You can\'t nom yourself!', flags: MessageFlags.Ephemeral });
		}
        const victim = await getUserAndUpdate(interaction.client.db.jeff, victim_id, victim_name, false);
        // nom logic
        victim.num_nommed += 1;
        await victim.save();
        console.log(`${victim.username} (${victim.userid}) was nommed.`);
		await interaction.reply(victim_name + killMsg[Math.floor(Math.random() * killMsg.length)]); // random kill msg
	},
};