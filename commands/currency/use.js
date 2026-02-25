import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { getUserAndUpdate, removeAmountFromInventory } from '../../helpers/utils.js';

async function equipItem(tbl, item, user_id, wanted_slot) {
    await tbl.upsert({
        userid: user_id,
        itemid: item.itemid,
        slot: wanted_slot
    });
}

async function consumeItem(interaction, item, itemRow) {
    const user = await getUserAndUpdate(interaction.client.db.jeff, interaction.user.id, interaction.member?.displayName || interaction.user.username, false);
    user[item.effect.stat] += item.effect.amount;
    await removeAmountFromInventory(interaction.client.db.equipment, itemRow, 1);
    await user.save();
    switch (item.itemid) {
        case "03CO001": // seaweed
            return interaction.reply({ content: `You ate the seaweed. It tasted horrible, but at least it was somewhat nutritious? (+${item.effect.amount} ${item.effect.stat})`, flags: MessageFlags.Ephemeral });
        default:
            return interaction.reply({ content: `You consumed the item. Why did you do that? (+${item.effect.amount} ${item.effect.stat})`, flags: MessageFlags.Ephemeral });
    }
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
    const itemRow = await interaction.client.db.inventory.findOne({
        where: { userid: interaction.user.id, itemid: interaction.options.getString("item") }
    });
    if (!itemRow || itemRow.amount <= 0) {
        return interaction.reply({ content: "You entered an invalid item or an item you don't own yet!", flags: MessageFlags.Ephemeral });
    }
    const item = interaction.client.itemCache.find((i) => i.itemid === interaction.options.getString("item"));
    switch (item.effect?.type || 0) {
        case "FUNNY":
            await interaction.reply({ content: item.effect.message, flags: MessageFlags.Ephemeral });
            break;
        case "EQUIP":
            await equipItem(interaction.client.db.equipment, item, interaction.user.id, item.effect.slot);
            await interaction.reply({ content: `You equipped ${item.name}.`, flags: MessageFlags.Ephemeral });
            break;
        case "CONSUME":
            await consumeItem(interaction, item, itemRow); // custom msg for each consumable so just let the helper handle it all
            break;
        case "JEFF_TAME_SCENE":
            await interaction.reply({ content: `tame scene goes here lol (u need enough energy and reputation)...ok bossfight idea: jeff has a "wildness level" and you have to do actions like wrestle (cost energy), intimidate(need certain amount of rep), and feed (need types of fish) on ur turn to reduce wildness. jeff will attack u on his turn and make u lose energy. if wildness to 0 then jeff gets tamed, if ur energy goes to 0 u lose. good idea or not gng`, flags: MessageFlags.Ephemeral });
            break;
        default:
            await interaction.reply({ content: `You entered an invalid item or you can't use this item! If you believe this is in error, please report it!`, flags: MessageFlags.Ephemeral });
    }
}