import { SlashCommandBuilder, MessageFlags } from 'discord.js';

async function equipItem(tbl, item, user_id, wanted_slot) {
    await tbl.upsert({
        userid: user_id,
        itemid: item.itemid,
        slot: wanted_slot
    });
}

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
            return { name: `${icitem.name} ${icitem.emoji}`, value: icitem.itemid };
        }
        return null;
    }).filter((i) => i).slice(0, 25);
    await interaction.respond(filteredItemList);
}
export async function execute(interaction) {
    let item = await interaction.client.db.inventory.findOne({
        where: { userid: interaction.user.id, itemid: interaction.options.getString("item") }
    });
    if (!item || item.amount <= 0) {
        await interaction.reply({ content: "You entered an invalid item or an item you don't own yet!", flags: MessageFlags.Ephemeral });
    }
    item = interaction.client.itemCache.find((i) => i.itemid === interaction.options.getString("item"));
    switch (item.effect?.type || 0) {
        case "FUNNY":
            await interaction.reply({ content: item.effect.message, flags: MessageFlags.Ephemeral });
            break;
        case "EQUIP":
            await equipItem(interaction.client.db.equipment, item, interaction.user.id, item.effect.slot);
            await interaction.reply({ content: `You equipped ${item.name}.`, flags: MessageFlags.Ephemeral });
            break;
        default:
            await interaction.reply({ content: `You entered an invalid item or you can't use this item! If you believe this is in error, please report it!`, flags: MessageFlags.Ephemeral });
    }
}