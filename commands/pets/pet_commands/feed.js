import { SlashCommandSubcommandBuilder, MessageFlags, escapeMarkdown } from 'discord.js';
import { getPetLevel, getUserAndUpdate, removeAmountFromInventory, updatePetStats } from '../../../helpers/utils.js';

// itemid fed to jeff: [hunger gained, xp gained, affection]
const jeffFeedTable = {
    "01CO005": [5, 5, 0],
    "01CO001": [10, 5, 0],
    "01RA002": [25, 20, 2],
    "01EP003": [50, 45, 8],
    "01LE004": [100, 80, 20]
};

export const data = new SlashCommandSubcommandBuilder()
    .setName('feed')
    .setDescription('Feed your pet!')
    .addStringOption(option => option
        .setName('item')
        .setDescription('Item to feed Jeff')
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
        if (icitem.name.toLowerCase().includes(focusedValue.toLowerCase()) && (icitem.itemid.startsWith("01"))) {
            return { name: `${icitem.name} ${icitem.emoji}`, value: icitem.itemid };
        }
        return null;
    }).filter((i) => i).slice(0, 25);
    await interaction.respond(filteredItemList);
}
export async function execute(interaction, pet) {
    const itemRow = await interaction.client.db.inventory.findOne({
        where: { userid: interaction.user.id, itemid: interaction.options.getString("item") }
    });
    if (!itemRow || itemRow.amount <= 0) {
        return interaction.reply({ content: "You entered an invalid item or an item you don't own yet!", flags: MessageFlags.Ephemeral });
    }
    const item = interaction.client.itemCache.find((i) => i.itemid === interaction.options.getString("item"));
    const level = getPetLevel(pet.xp);
    const xpLoss = await updatePetStats(pet, level); 
    const xp = jeffFeedTable[item.itemid][1];
    await removeAmountFromInventory(interaction.client.db.equipment, itemRow, 1);
    let hunger = jeffFeedTable[item.itemid][0];
    // cap at 100
    hunger = Math.min(100 - pet.hunger, hunger);
    let affection = jeffFeedTable[item.itemid][2];
    // cap at 100
    affection = Math.min(100 - pet.affection, affection);
    pet.hunger += hunger;
    pet.xp += xp;
    pet.affection += affection;
    const currentTime = Date.now();
    pet.last_fed = currentTime;
    await pet.save();
    await interaction.reply(`You fed ${escapeMarkdown(pet.name)} a ${item.name}! (+${hunger} hunger) (+${xp} xp) ${(affection > 0) ? `(+${affection} affection)` : ""}`);
    if (xpLoss > 0) await interaction.followUp({ content: `Oh no! While you were away, your pet's hunger and affection dropped to 0 for too long, losing ${xpLoss} XP. Spend some time with your buddy!`, flags: MessageFlags.Ephemeral });
    console.log(`${interaction.user.displayName} (${interaction.user.id}) fed their pet with ${item.name}.`);
}   
