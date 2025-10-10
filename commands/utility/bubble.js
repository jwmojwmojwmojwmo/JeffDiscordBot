const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUserAndUpdate } = require('../../utils.js');

const energytoBubble = 25;

// return -1 if success, or energy needed to spit
async function bubble(tbl, victim_id, victim_name, culprit_id, culprit_name) {
	let victim = await getUserAndUpdate(tbl, victim_id, victim_name, false);
	let culprit = await getUserAndUpdate(tbl, culprit_id, culprit_name, false);
	if (culprit.energy < energytoBubble) {
		await victim.save();
		await culprit.save();
		return energytoBubble - culprit.energy;
	}
	culprit.energy -= energytoBubble;
	victim.reputation += 1;
	await victim.save();
	await culprit.save();
	return -1;
}

module.exports = {
	cooldown: 7,
	data: new SlashCommandBuilder()
		.setName('bubble')
		.setDescription(`Bubble someone with Jeff and make them gain reputation! (${energytoBubble} energy cost)`)
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('Who you want to Jeff to bubble?')
				.setRequired(true)),
	async execute(interaction) {
		if (!interaction.guild) {
			return interaction.reply({ content: 'This command can\'t be used in DMs.', flags: MessageFlags.Ephemeral });
		}
		if (interaction.options.getUser('user').id === interaction.user.id) {
			return interaction.reply({ content: 'You can\'t bubble yourself!', flags: MessageFlags.Ephemeral });
		}
		const tbl = interaction.client.db.jeff;
		const victim = interaction.options.getMember('user').displayName;
		const culprit = interaction.member.displayName;
		const success = await bubble(tbl, interaction.options.getUser('user').id, victim, interaction.user.id, culprit);
		if (success === -1) {
			return interaction.reply(`${culprit} bubbled ${victim}! ${culprit} has used ${energytoBubble} energy, and ${victim} has gained 1 reputation!`);
		}
		await interaction.reply({ content: `You need ${success} more energy to run this command!`, flags: MessageFlags.Ephemeral });
	},
};