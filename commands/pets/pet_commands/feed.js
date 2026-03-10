import { SlashCommandSubcommandBuilder, MessageFlags, escapeMarkdown, heading, ContainerBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputStyle, LabelBuilder, TextInputBuilder, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { getPetLevel, getUserAndUpdate, removeAmountFromInventory, updatePetStats } from '../../../helpers/utils.js';

// itemid fed to jeff: [hunger gained, xp gained]
const jeffFeedTable = {
    "01CO001": [15, 5],
    "01RA002": [40, 15],
    "01EP003": [65, 25],
    "01LE004": [100, 40]
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
export async function execute(interaction) {
    const pet = await interaction.client.db.pets.findByPk(interaction.user.id);
    if (!pet) return interaction.reply({ content: `You don't have a pet yet! But rumor has it if you fish up something unknown and use it, you might just find a feisty companion.`, flags: MessageFlags.Ephemeral });
    const itemRow = await interaction.client.db.inventory.findOne({
        where: { userid: interaction.user.id, itemid: interaction.options.getString("item") }
    });
    if (!itemRow || itemRow.amount <= 0) {
        return interaction.reply({ content: "You entered an invalid item or an item you don't own yet!", flags: MessageFlags.Ephemeral });
    }
    const item = interaction.client.itemCache.find((i) => i.itemid === interaction.options.getString("item"));
    const level = getPetLevel(pet.xp);
    await updatePetStats(pet, level); 
    const xp = jeffFeedTable[item.itemid][1];
    await removeAmountFromInventory(interaction.client.db.equipment, itemRow, 1);
    let hunger = jeffFeedTable[item.itemid][0];
    // cap at 100
    hunger = Math.min(100 - pet.hunger, hunger);
    pet.hunger += hunger;
    pet.xp += xp;
    const currentTime = Date.now();
    pet.last_fed = currentTime;
    await pet.save();
    await interaction.reply(`You fed ${escapeMarkdown(pet.name)} a ${item.name}! (+${hunger} hunger) (+${xp} xp)`);
    console.log(`${interaction.user.displayName} (${interaction.user.id}) fed their pet with ${item.name}.`);
}   
