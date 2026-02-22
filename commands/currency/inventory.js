import { SlashCommandBuilder, MessageFlags, escapeMarkdown, bold, italic, ContainerBuilder, ButtonStyle, heading } from 'discord.js';
import { getUserAndUpdate } from '../../helpers/utils.js';

const timeoutContainer = new ContainerBuilder()
    .addTextDisplayComponents((text) => text.setContent(`This interaction timed out.`));

// keep user obj in case we wanna have # of item in inventory
function getFormattedInventoryItem(allItems, invItem, user) {
    const item = allItems.find(i => i.itemid = invItem.itemid);
    return `${item.name}  ${item.emoji}   ─   ${invItem.amount}`
}
 
export const data = new SlashCommandBuilder()
    .setName('inventory')
    .setDescription(`Look at yours or someone else's inventory`)
    .addUserOption(option => option
        .setName('user')
        .setDescription('The user that you want to look at the inventory of'));
export async function execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const user_id = target.id;
    let user_name;
    if (!interaction.guild) {
        user_name = target.username;
    } else {
        user_name = interaction.options.getMember('user')?.displayName || interaction.member.displayName;
    }
    const user = await getUserAndUpdate(interaction.client.db.jeff, user_id, user_name, true);
    const userinv = await interaction.client.db.inventory.findAll({
        where: { userid: user_id }
    });
    const allItems = await interaction.client.db.items.findAll();
    const container = new ContainerBuilder()
        .setAccentColor(0x80aaff)
        .addTextDisplayComponents((text) => text.setContent(`${heading(`${escapeMarkdown(user_name)}'s Inventory`, 2)}\n`))
        .addSeparatorComponents((separator) => separator);
    if (userinv.length === 0) {
        container.addTextDisplayComponents((text) => text.setContent("You don't have anything in your inventory yet!"));
    }
    for (const item of userinv) {
        container.addTextDisplayComponents((text) => text.setContent(getFormattedInventoryItem(allItems, item, user)));
    }
    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
}