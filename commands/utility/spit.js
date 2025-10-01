const { SlashCommandBuilder, MessageFlags } = require('discord.js');

const energyToSpit = 25;

// return -1 if success, or energy needed to spit
async function spit(tbl, user_id, user_name, culprit_id, culprit_username) {
	let victim = await tbl.findByPk(user_id);
	let culprit = await tbl.findByPk(culprit_id);
	if (victim) {
		victim.username = user_name;
	}
	else {
		victim = await tbl.create({
			userid: user_id,
			username: user_name,
		});
		console.log('New user created:', victim.toJSON());
	}
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
	if (culprit.energy < energyToSpit) {
		await victim.save();
		await culprit.save();
		return energyToSpit - culprit.energy;
	}
	culprit.energy -= energyToSpit;
	victim.reputation -= 1;
	await victim.save();
	await culprit.save();
	return -1;
}

module.exports = {
	cooldown: 7,
	data: new SlashCommandBuilder()
		.setName('spit')
		.setDescription(`Spit on someone with Jeff and make them lose reputation! (${energyToSpit} energy cost)`)
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('Who you want to Jeff to spit on?')
				.setRequired(true)),
	async execute(interaction) {
		if (!interaction.guild) {
			return interaction.reply({ content: 'This command can\'t be used in DMs.', flags: MessageFlags.Ephemeral });
		}
		if (interaction.options.getUser('user').id === interaction.user.id) {
			return interaction.reply({ content: 'You can\'t spit on yourself!', flags: MessageFlags.Ephemeral });
		}
		const tbl = interaction.client.db.jeff;
		const victim = interaction.options.getMember('user').displayName;
		const culprit = interaction.member.displayName;
		const success = await spit(tbl, interaction.options.getUser('user').id, victim, interaction.user.id, culprit);
		if (success === -1) {
			return interaction.reply(`${culprit} spit on ${victim}! ${culprit} has used ${energyToSpit} energy, and ${victim} has lost 1 reputation!`);
		}
		await interaction.reply({ content: `You need ${success} more energy to run this command!`, flags: MessageFlags.Ephemeral });
	},
};