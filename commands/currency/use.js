import { SlashCommandBuilder, MessageFlags, escapeMarkdown, bold, italic, ContainerBuilder, ButtonStyle, heading, ButtonBuilder } from 'discord.js';
import { getUserAndUpdate, removeAmountFromInventory, addAmountToInventory } from '../../helpers/utils.js';
import { Op } from 'sequelize';

export const data = new SlashCommandBuilder()
    .setName('use')
    .setDescription(`Use an item in your inventory`)
    .addStringOption(option => option
        .setName('item')
        .setDescription('Item to use/equip')
        .setRequired(true)
        .setAutocomplete(true));
export async function autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const user_id = interaction.user.id;
    const userinv = await interaction.client.db.inventory.findAll({
        where: { userid: user_id }
    });
    let filteredItemList = userinv.map((i) => {
        const icitem = interaction.client.itemCache.find((ic) => i.itemid === ic.itemid);
        if (icitem.name.toLowerCase().includes(focusedValue.toLowerCase()) && icitem.effect) {
            return { name: `${icitem.name} ${icitem.emoji}`, value: icitem.itemid }
        }
        return null;
    }).filter((i) => i).slice(0, 25);
    await interaction.respond(filteredItemList);
}
export async function execute(interaction) {
    await interaction.reply(`Chose ${interaction.options.getString('item')}`);
}