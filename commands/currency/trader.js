import { SlashCommandBuilder, MessageFlags, escapeMarkdown, bold, italic, ContainerBuilder, ButtonStyle, heading, ButtonBuilder } from 'discord.js';
import { getUserAndUpdate } from '../../helpers/utils.js';

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

export const data = new SlashCommandBuilder()
    .setName('trader')
    .setDescription(`Check the trader to trade items with!`);
export async function execute(interaction) {
    console.log("Someone opened the trader.");
    const itemsDb = interaction.client.db.items;
    const user = await getUserAndUpdate(interaction.client.db.jeff, interaction.user.id, interaction.member?.displayName || interaction.user.username, true);
    const allItems = await itemsDb.findAll();
    const shopItems = allItems.filter(i => i.cost !== null);
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
        }
        const id = i.customId.split("_")[1];
        let item = shopItems.find(i => i.itemid === id);
        for (const [itemId, amount] of Object.entries(item.cost)) {
            let costItem = allItems.find(i => i.itemid === itemId);
            // TODO
        }
    });
    collector.on('end', async (_collected, reason) => {
        await interaction.deleteReply();
    })
}