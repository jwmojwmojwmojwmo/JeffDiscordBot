import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { addAmountToInventory, getUserAndUpdate, removeAmountFromInventory } from '../../helpers/utils.js';

export const data = new SlashCommandBuilder()
    .setName('giveenergy')
    .setDescription(`Input id get item`)
    .addUserOption(option => option
        .setName('user')
        .setDescription('user to give')
        .setRequired(true))
    .addIntegerOption(option => option
        .setName('amount')
        .setDescription('you know what this does gnaglanga'));
export async function execute(interaction) {
    const user = await getUserAndUpdate(interaction.client.db.jeff, interaction.options.getUser('user').id, interaction.options.getUser("user").username, false);
    user.energy += interaction.options.getInteger("amount");
    await user.save();
    await interaction.reply({ content: `Gave ${interaction.options.getUser('user').username} ${interaction.options.getInteger('amount')} energy`, flags: MessageFlags.Ephemeral });
}