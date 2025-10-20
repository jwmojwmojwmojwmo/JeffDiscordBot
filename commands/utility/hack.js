const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUserAndUpdate } = require('../../utils.js');

// return 1 if success, 0 if not
async function gift(interaction, tbl, victim_id, victim_name, culprit_id, culprit_name, amount) {
    let victim = await getUserAndUpdate(tbl, victim_id, victim_name, false);
    let culprit = await getUserAndUpdate(tbl, culprit_id, culprit_name, false);
    if (culprit.energy < amount) {
        await victim.save();
        await culprit.save();
        return interaction.reply({ content: `You don't have enough energy to give this much!`, flags: MessageFlags.Ephemeral });
    }
    culprit.energy -= amount;
    victim.energy += amount;
    await victim.save();
    await culprit.save();
    console.log(`${victim.username} (${victim.userid}) was given ${amount} energy by ${culprit.username} (${culprit.userid})`);
    return interaction.reply(`${culprit.username} shared ${amount} energy with ${victim.username}!\n\nJeff saw everything. Jeff is proud. Jeff may or may not have stolen some energy for snacks.`);
}

// TODO: add autofill/default values
module.exports = {
    data: new SlashCommandBuilder()
        .setName('hack')
        .setDescription('Dev tool')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('user')
                .setRequired(true))
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('amount')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('stat_type')
                .setDescription('stat_type')
                .setRequired(true)
                .addChoices(
                    { name: 'nom_count', value: 'num_nommed' },
                    { name: 'energy', value: 'energy' },
                    { name: 'reputation', value: 'reputation' },
                )),
    async execute(interaction) {
        const victim_name = interaction.options.getMember('user')?.displayName || interaction.options.getUser('user').username;
        const type = interaction.options.getString('stat_type');
        const amount = interaction.options.getInteger('amount');
        let user = await getUserAndUpdate(interaction.client.db.jeff, interaction.options.getUser('user').id, victim_name, false);
        user[type] += amount;
        await user.save();
        return interaction.reply(`${victim_name}'s ${type} + ${amount} = ${user[type]}`);
    },
};