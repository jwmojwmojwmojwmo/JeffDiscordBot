const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const killMsg = [
	' got gobbled by Jeff. Chomp chomp! NOM NOM!',
	' was just swallowed by Jeff whole. Slurp slurp!',
	' is now Jeff’s snack. *nomnomnom*',
	' was caught by Jeff in his jaws. Crunch crunch!',
	' vanished... and Jeff’s tummy says thanks! NOMNOM!',
	' got Jeff’ed. Nomfest initiated!',
];

async function kill_tbl(tbl, to_perish_userid, to_perish_username, culprit_id, culprit_username) {
	let victim = await tbl.findByPk(to_perish_userid);
	let culprit = await tbl.findByPk(culprit_id);
	if (culprit) {
		culprit.username = culprit_username;
	}
	else {
		culprit = await tbl.create({
			userid: culprit_id,
			username: culprit_username,
		});
		console.log('New user created:', culprit.toJSON());
	}
	if (victim) {
		victim.username = to_perish_username;
	}
	else {
		victim = await tbl.create({
			userid: to_perish_userid,
			username: to_perish_username,
		});
		console.log('New user created:', victim.toJSON());
	}
	victim.num_nommed += 1;
	await victim.save();
	await culprit.save();
}

module.exports = {
	cooldown: 7,
	data: new SlashCommandBuilder()
		.setName('jeffnom')
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
		if (interaction.options.getUser('user').id === interaction.user.id) {
			return interaction.reply({ content: 'You can\'t nom yourself!', flags: MessageFlags.Ephemeral });
		}
		const tbl = interaction.client.db.jeff;
		const name = interaction.options.getMember('user').displayName;
		await kill_tbl(tbl, interaction.options.getUser('user').id, name, interaction.user.id, interaction.member.displayName);
		await interaction.reply(name + killMsg[Math.floor(Math.random() * killMsg.length)]); // random kill msg
	},
};