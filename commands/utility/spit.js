const { SlashCommandBuilder, MessageFlags, escapeMarkdown } = require('discord.js');
const { getUserAndUpdate } = require('../../utils.js');

const energyToSpit = 25;

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
        const db = interaction.client.db.jeff;
        const victim_name = interaction.options.getMember('user').displayName;
        const culprit_name = interaction.member.displayName;
        const victim = await getUserAndUpdate(db, interaction.options.getUser('user').id, victim_name, false);
        const culprit = await getUserAndUpdate(db, interaction.user.id, culprit_name, false);
        // spitting logic
        if (culprit.energy < energyToSpit) {
            await victim.save();
            await culprit.save();
            await interaction.reply({ content: `You need ${energyToSpit - culprit.energy} more energy to run this command!`, flags: MessageFlags.Ephemeral });
        } else {
            culprit.energy -= energyToSpit;
            victim.reputation -= 1;
            await victim.save();
            await culprit.save();
            console.log(`${victim.username} (${victim.userid}) was spit on by ${culprit.username} (${culprit.userid})`);
            await interaction.reply(escapeMarkdown(`${culprit_name} spit on ${victim_name}! ${culprit_name} has used ${energyToSpit} energy, and ${victim_name} lost 1 reputation!`));
        }
	},
};