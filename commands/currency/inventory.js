import { SlashCommandBuilder, MessageFlags, escapeMarkdown, bold, italic, ContainerBuilder, ButtonStyle, heading, subtext } from 'discord.js';
import { getUserAndUpdate, renderUsername } from '../../helpers/utils.js';

const timeoutContainer = new ContainerBuilder()
    .addTextDisplayComponents((text) => text.setContent(`This interaction timed out.`));

// keep user obj in case we wanna have # of item in inventory
function getFormattedInventoryItem(allItems, invItem, user) {
    const item = allItems.find(i => i.itemid === invItem.itemid);
    return `${item.name}  ${item.emoji}   ─   ${invItem.amount}`;
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
        user_name = target.displayName;
    } else {
        user_name = interaction.options.getMember('user')?.displayName || interaction.member.displayName;
    }
    const user = await getUserAndUpdate(interaction.client.db, user_id, user_name, true);
    const rendered_user_name = renderUsername(user, user_name);
    const userinv = await interaction.client.db.inventory.findAll({
        where: { userid: user_id }
    });
    const container = new ContainerBuilder()
        .setAccentColor(0x80aaff)
        .addTextDisplayComponents((text) => text.setContent(`${heading(`${rendered_user_name}'s Inventory`, 2)}\n`))
        .addSeparatorComponents((separator) => separator);
    let items = userinv.length;
    for (const item of userinv) {
        if (item.itemid[1] !== "0") {
            container.addTextDisplayComponents((text) => text.setContent(getFormattedInventoryItem(interaction.client.itemCache, item, user)));
        } else {
            items--;
        }
    }
    if (items === 0) container.addTextDisplayComponents((text) => text.setContent("You don't have anything in your inventory yet!"));

    container.addSeparatorComponents((separator) => separator);
    container.addTextDisplayComponents((text) => text.setContent(subtext(`Tip: Use /item to get detailed information about any item!`)));
    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    console.log(`${user.username}'s inventory was checked.`)
}