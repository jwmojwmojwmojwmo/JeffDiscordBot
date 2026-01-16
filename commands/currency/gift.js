import { SlashCommandBuilder, MessageFlags, escapeMarkdown } from 'discord.js';
import { getUserAndUpdate } from '../../helpers/utils.js';

async function gift(interaction, victim, culprit, amount) {
    const baseTax = 0.2;
    const k = 100; // controls scaling, k = num_nommed at which the taxRate is exactly half of baseTax
    const taxRate = baseTax * (k / (k + culprit.num_nommed));
    const amountWithTax = Math.round(amount * (1 + taxRate));
    const amountTaxed = amountWithTax - amount;
    let reputationGained = 0;
    if (culprit.energy < amountWithTax) {
        await victim.save();
        await culprit.save();
        return interaction.reply({ content: `You don't have enough energy to give this much! (with Jeff tax, you must pay ${amountWithTax} in total.)`, flags: MessageFlags.Ephemeral });
    }
    culprit.energy -= amountWithTax;
    victim.energy += amount;
    if (amountTaxed > 25) {
        const chance = Math.min(0.75, amountTaxed * 0.002);
        if (Math.random() < chance) {
            reputationGained = Math.round(Math.min(50, amountTaxed * 0.1));
        }
    }
    culprit.reputation += reputationGained;
    await victim.save();
    await culprit.save();
    console.log(`${victim.username} (${victim.userid}) was given ${amount} energy by ${culprit.username} (${culprit.userid}), but spent ${amountWithTax} and gained ${reputationGained} reputation.`);
    return interaction.reply(escapeMarkdown(
        `${culprit.username} gave ${amount} energy to ${victim.username}!\n\n` +
        `Jeff saw everything. Jeff is proud.${amountTaxed === 0 ? '' : ` Jeff may have sneakily munched ${amountTaxed} energy as a tax snack.`} ${reputationGained > 0 ? `Impressed with ${culprit.username}'s generosity, Jeff burped out ${reputationGained} reputation for ${culprit.username}!` : `Jeff nods approvingly.`}`
    ));
}

export const data = new SlashCommandBuilder()
    .setName('gift')
    .setDescription('Gift energy to another user! Note that there is tax associated with gifting.')
    .addUserOption(option => option
        .setName('user')
        .setDescription('User that you want to gift')
        .setRequired(true))
    .addIntegerOption(option => option
        .setName('amount')
        .setDescription('Amount of energy to gift, pre-tax.')
        .setRequired(true));
export async function execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const victim_id = interaction.options.getUser('user').id;
    if (!interaction.guild) {
        return interaction.reply({ content: 'This command can\'t be used in DMs.', flags: MessageFlags.Ephemeral });
    }
    if (amount <= 0) {
        return interaction.reply({ content: `You can't gift this amount!`, flags: MessageFlags.Ephemeral });
    }
    if (victim_id === interaction.user.id) {
        return interaction.reply({ content: 'You can\'t gift to yourself!', flags: MessageFlags.Ephemeral });
    }
    const victim_name = interaction.options.getMember('user').displayName;
    const culprit_name = interaction.member.displayName;
    const db = interaction.client.db.jeff;
    const victim = await getUserAndUpdate(db, victim_id, victim_name, false);
    const culprit = await getUserAndUpdate(db, interaction.user.id, culprit_name, false);
    await gift(interaction, victim, culprit, amount);
}