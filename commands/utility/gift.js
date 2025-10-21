const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUserAndUpdate } = require('../../utils.js');

async function gift(interaction, tbl, victim_id, victim_name, culprit_id, culprit_name, amount) {
    let victim = await getUserAndUpdate(tbl, victim_id, victim_name, false);
    let culprit = await getUserAndUpdate(tbl, culprit_id, culprit_name, false);
    if (culprit.energy < amount) {
        await victim.save();
        await culprit.save();
        return interaction.reply({content: `You don't have enough energy to give this much!`, flags: MessageFlags.Ephemeral});
    }
    culprit.energy -= amount;
    victim.energy += amount;
    await victim.save();
    await culprit.save();
    console.log(`${victim.username} (${victim.userid}) was given ${amount} energy by ${culprit.username} (${culprit.userid})`);
    return interaction.reply(`${culprit.username} shared ${amount} energy with ${victim.username}!\n\nJeff saw everything. Jeff is proud. Jeff may or may not have stolen some energy for snacks.`);
}

// TODO: add tax based on global nom count (jeff more/less hungry)
// TODO: add reputation gain when gifting sum
module.exports = {
    data: new SlashCommandBuilder()
        .setName('gift')
        .setDescription('Gift energy to another user!')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User that you want to gift')
                .setRequired(true))
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Amount of energy to gift')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'This command can\'t be used in DMs.', flags: MessageFlags.Ephemeral });
        }
        const victim_name = interaction.options.getMember('user')?.displayName || interaction.options.getUser('user').username;
        const culprit_name = interaction.member?.displayName || interaction.user.username;
        await gift(interaction, interaction.client.db.jeff, interaction.options.getUser('user').id, victim_name,
            interaction.user.id, culprit_name, interaction.options.getInteger('amount'));
    },
};