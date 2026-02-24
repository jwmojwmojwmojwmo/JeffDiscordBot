import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { addAmountToInventory, removeAmountFromInventory } from '../../helpers/utils.js';

export const data = new SlashCommandBuilder()
    .setName('giveitem')
    .setDescription(`Input id get item`)
    .addUserOption(option => option
        .setName('user')
        .setDescription('user to give')
        .setRequired(true))
    .addStringOption(option => option
        .setName('id')
        .setDescription('ID of item'))
    .addIntegerOption(option => option
        .setName('amount')
        .setDescription('you know what this does gnaglanga'));
export async function execute(interaction) {
    const item_id = interaction.options.getString('id');
    const item = await interaction.client.db.items.findOne({
        where: { itemid: item_id }
    });
    if (!item) {
        return interaction.reply({ content: "this item doesnt exist lol", flags: MessageFlags.Ephemeral });
    }
    if (interaction.options.getInteger('amount') < 0) {
        const itemRow = await interaction.client.db.inventory.findOne({
            where: { userid: interaction.options.getUser('user').id, itemid: item_id }
        })
        await removeAmountFromInventory(interaction.client.db.equipment, itemRow, -interaction.options.getInteger('amount'));
    } else {
        await addAmountToInventory(interaction.client.db.inventory, interaction.options.getUser('user').id, item, interaction.options.getInteger('amount'));
    }
    await interaction.reply({ content: `Gave ${interaction.options.getUser('user').username} ${interaction.options.getInteger('amount')} ${item.name}`, flags: MessageFlags.Ephemeral });
}