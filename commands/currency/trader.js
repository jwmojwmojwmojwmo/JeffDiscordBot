import { SlashCommandBuilder, MessageFlags, escapeMarkdown, bold, italic, ContainerBuilder, ButtonStyle, heading, ButtonBuilder } from 'discord.js';
import { getUserAndUpdate, removeAmountFromInventory, addAmountToInventory } from '../../helpers/utils.js';
import { Op } from 'sequelize';

const timeoutContainer = new ContainerBuilder()
    .addTextDisplayComponents((text) => text.setContent(`This interaction timed out.`));


// keep user obj in case we wanna have # of item in inventory
function getFormattedShopItem(allItems, shopItem, user) {
    let costsText = "";
    for (const [itemId, amount] of Object.entries(shopItem.cost)) { // object.entries turns the json into key:value pairs that can be iterated through
        let itemName = allItems.find(i => i.itemid === itemId);
        itemName = itemName.name;
        costsText += `${amount} ${itemName}${amount === 1 ? "" : "s"} + `;
    }
    costsText = costsText.slice(0, -3);
    return `${bold(`${shopItem.name}  ${shopItem.emoji}`)}\nCost: ${costsText}\n${italic(shopItem.description)}`
}

async function attemptToPurchase(item, userinv, id, tbl) {
    for (const [itemId, amount] of Object.entries(item.cost)) {
        const costItem = userinv.find(i => i.itemid === itemId);
        if ((costItem?.amount || 0) < amount) {
            return -1;
        }
    }
    for (const [itemId, amount] of Object.entries(item.cost)) {
        const costItem = userinv.find(i => i.itemid === itemId);
        await removeAmountFromInventory(costItem, amount);
    }
    await addAmountToInventory(tbl, id, item, 1);
    return 1;
}

export const data = new SlashCommandBuilder()
    .setName('trader')
    .setDescription(`Check the trader to trade items with!`);
export async function execute(interaction) {
    const user = await getUserAndUpdate(interaction.client.db.jeff, interaction.user.id, interaction.member?.displayName || interaction.user.username, true);
    const allItems = interaction.client.itemCache;
    const shopItems = allItems.filter(i => i.cost !== null);
    // build display container
    const container = new ContainerBuilder()
        .setAccentColor(0x80aaff)
        .addTextDisplayComponents((text) => text.setContent(`${heading("🏝️ Jeff's Trading Post", 1)}\nMRRR!! MRR! (Translation: All sales are final. No refunds.)`))
        .addSeparatorComponents((separator) => separator);
    for (const item of shopItems) {
        container
            .addSectionComponents((s) => s
                .addTextDisplayComponents((text) => text.setContent(getFormattedShopItem(allItems, item, user)))
                .setButtonAccessory((button) => button.setCustomId(`buy_${item.itemid}`).setLabel(`Buy ${item.name}`).setStyle(ButtonStyle.Primary)));
    }
    container
        .addActionRowComponents((row) => row.addComponents(
            new ButtonBuilder()
                .setCustomId('close_shop')
                .setLabel('Close Shop')
                .setStyle(ButtonStyle.Danger)));
    const reply = await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    // interaction collector
    const collectorFilter = i => i.user.id === interaction.user.id;
    const collector = await reply.createMessageComponentCollector({
        filter: collectorFilter,
        time: 120_000
    });
    collector.on('collect', async i => {
        if (i.customId === 'close_shop') {
            // must explicitly update i with .update or .reply, etc... to respond to the i even if you're just deleting the message afterwards otherwise discord throws a hissy fit
            // discord really needs that i to be responded to
            // or maybe not i'm not reading all that documentation
            // but yeah make sure you let discord know you're responding to i
            await i.update({ components: [timeoutContainer], flags: MessageFlags.IsComponentsV2 });
            collector.stop();
            return;
        } else {
            const id = i.customId.split("_")[1];
            const item = shopItems.find(i => i.itemid === id);
            const requiredItemIds = Object.keys(item.cost);
            const userinv = await interaction.client.db.inventory.findAll({
                where: {
                    userid: interaction.user.id,
                    itemid: { [Op.in]: requiredItemIds }
                }
            });
            const purchaseSuccess = await attemptToPurchase(item, userinv, interaction.user.id, interaction.client.db.inventory);
            if (purchaseSuccess === -1) {
                await i.reply({ content: "You don't have enough materials to purchase this!", flags: MessageFlags.Ephemeral });
                console.log(`${interaction.user.username} (${interaction.user.id}) tried to purchase ${item.name} but couldn't afford it.`);
            } else {
                await i.reply({ content: `Purchased ${item.name}!`, flags: MessageFlags.Ephemeral });
                console.log(`${interaction.user.username} (${interaction.user.id}) purchased ${item.name}.`);
            }
        }
    });
    collector.on('end', async (_collected, reason) => {
        await interaction.deleteReply().catch(console.error); // in case the message is deleted some other way
    })
}