import { SlashCommandBuilder, MessageFlags, ContainerBuilder, heading, bold, italic } from 'discord.js';

const RARITY_MAPPINGS = Object.freeze({
    CO: "Common",
    RA: "Rare",
    EP: "Epic",
    LE: "Legendary"
});

const EFFECT_MAPPINGS = Object.freeze({
    FUNNY: `but may still be useless.`,
    EQUIP: `can be equipped.`,
    CONSUME: `can be consumed for some kind of effect.`
})

function getItemCost(allItems, cost) {
    let costsText = "";
    for (const [itemId, amount] of Object.entries(cost)) {
        let itemName = allItems.find(i => i.itemid === itemId);
        itemName = itemName.name;
        costsText += `${amount} ${itemName}${amount === 1 ? "" : "s"} + `;
    }
    costsText = costsText.slice(0, -3);
    return costsText;
}

export const data = new SlashCommandBuilder()
    .setName('item')
    .setDescription(`See additional information about an item`)
    .addStringOption(option => option
        .setName('item')
        .setDescription('Item to see additional information for')
        .setRequired(true)
        .setAutocomplete(true));
export async function autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    let filteredItemList = interaction.client.itemCache.filter((i) => i.name.toLowerCase().includes(focusedValue.toLowerCase()));
    filteredItemList = filteredItemList.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 25).map((i) => ({ name: `${i.name} ${i.emoji}`, value: i.itemid }));
    await interaction.respond(filteredItemList);
}
export async function execute(interaction) {
    const item = interaction.client.itemCache.find((i) => i.itemid === interaction.options.getString('item'));
    if (!item) {
        return interaction.reply({ content: "That isn't a valid item!", flags: MessageFlags.Ephemeral });
    }
    const rarityText = `${bold("Rarity")}: ${RARITY_MAPPINGS[item.rarity] || "unknown"}`;
    const buyableText = `${bold("Buyable")}: ${item.cost ? `Yes, costs ${getItemCost(interaction.client.itemCache, item.cost)}.` : `No`}`;
    let useableText = `${bold("Usable")}: `;
    if (item.effect) {
        useableText += `Yes, ${EFFECT_MAPPINGS[item.effect.type] || `it has an unknown effect.`}`
    } else {
        useableText += `No`;
    }
    let amountText = `${bold("You have ")}`;
    const itemRow = await interaction.client.db.inventory.findOne({
        where: {
            userid: interaction.user.id,
            itemid: item.itemid
        }
    });
    amountText += `${itemRow ? itemRow.amount : 0} ${bold("of this item.")}`;
    const container = new ContainerBuilder()
        .setAccentColor(0x80aaff)
        .addTextDisplayComponents((text) => text.setContent(heading(`Item Info: ${item.name}  ${item.emoji}`, 2)))
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((text) => text.setContent(italic(item.description)))
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((text) => text.setContent(`${bold("Item ID")}: ${item.itemid}`))
        .addTextDisplayComponents((text) => text.setContent(rarityText))
        .addTextDisplayComponents((text) => text.setContent(buyableText))
        .addTextDisplayComponents((text) => text.setContent(useableText))
        .addTextDisplayComponents((text) => text.setContent(amountText));
    await interaction.reply({ components: [container], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
}
