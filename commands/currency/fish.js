import { SlashCommandBuilder, MessageFlags, getUserAgentAppendix } from 'discord.js';
import { setTimeout } from 'node:timers/promises';
import { addAmountToInventory, getUserAndUpdate, removeAmountFromInventory } from '../../helpers/utils.js';

const energyToFish = 5;
const fishingLootTables = {
    "HAND": [
        { itemid: "nothing", weight: 15 },    // 15% chance to catch absolutely nothing
        { itemid: "03CO001", weight: 15 },    // seaweed  
        { itemid: "02CO001", weight: 65 },    // Driftwood
        { itemid: "01CO001", weight: 5 }   // Common Fish
    ],
    // Old Fishing Rod
    "11CO001": [
        { itemid: "nothing", weight: 10 },    // 15% fail rate
        { itemid: "02CO001", weight: 40 },    // Driftwood
        { itemid: "01CO001", weight: 37.5 },  // Common Fish
        { itemid: "03CO001", weight: 10 },    // seaweed
        { itemid: "02RA002", weight: 2.4 },     // Scrap Metal
        { itemid: "09LE001", weight: 0.1 }    // Unknown Fish (Jeff)
    ],
    // Beginner Fishing Rod
    "11CO002": [
        { itemid: "nothing", weight: 10 },    // 10% fail rate
        { itemid: "01CO001", weight: 45 },    // Common Fish
        { itemid: "02CO001", weight: 25 },    // Driftwood
        { itemid: "02RA002", weight: 9 },     // Scrap Metal
        { itemid: "03CO001", weight: 5 },    // seaweed
        { itemid: "01RA002", weight: 5 },     // Rare Fish
        { itemid: "09LE001", weight: 1 }      // Unknown Fish (Jeff)
    ],
    // Reinforced Fishing Rod 
    "11RA003": [
        { itemid: "nothing", weight: 5 },     // 5% fail rate
        { itemid: "01CO001", weight: 25 },    // Common Fish
        { itemid: "02RA002", weight: 20 },    // Scrap Metal
        { itemid: "01RA002", weight: 20 },    // Rare Fish
        { itemid: "02CO001", weight: 10 },    // Driftwood
        { itemid: "01EP003", weight: 12 },    // Epic Fish
        { itemid: "01LE004", weight: 6 },     // Legendary Fish
        { itemid: "09LE001", weight: 2 }      // Unknown Fish (Jeff)
    ],
    // 4. Deep Sea Harpoon
    "11EP004": [
        { itemid: "nothing", weight: 15 },     // 15% fail rate (higher cuz idk why not)
        { itemid: "01RA002", weight: 45 },    // Rare Fish
        { itemid: "01EP003", weight: 25 },    // Epic Fish
        { itemid: "01LE004", weight: 10 },    // Legendary Fish
        { itemid: "09LE001", weight: 5 }      // Unknown Fish (Jeff)
    ]
};

export const cooldown = 20;
export const data = new SlashCommandBuilder()
    .setName('fish')
    .setDescription(`Go fishing for some goodies (costs ${energyToFish} energy)!`)
export async function execute(interaction) {
    const user = await getUserAndUpdate(interaction.client.db.jeff, interaction.user.id, interaction.member?.displayName || interaction.user.displayName, false);
    if (user.energy < energyToFish) {
        await user.save();
        interaction.client.cooldowns.get('fish').delete(interaction.user.id); //reset cooldown
        return interaction.reply({ content: "You don't have enough energy to fish!", flags: MessageFlags.Ephemeral });
    }
    user.energy -= energyToFish;
    await user.save();
    let rod = await interaction.client.db.equipment.findOne({
        where: { userid: interaction.user.id, slot: "fishing_rod" }
    })
    if (!rod) {
        rod = { itemid: "HAND", name: "Hand" }
    } else {
        rod = interaction.client.itemCache.find((i) => i.itemid === rod.itemid);
    }
    await interaction.reply(`You spent 5 energy and started fishing with your ${rod.name}...\n\n(Tip: Run /use to equip another fishing rod in your inventory!)`);
    let roll = Math.random() * 100;
    const lootTable = fishingLootTables[rod.itemid];
    let caughtItem = lootTable[lootTable.length - 1].itemid;
    for (const drop of lootTable) {
        if (roll <= drop.weight) {
            caughtItem = drop.itemid;
            break;
        }
        roll -= drop.weight;
    }
    await setTimeout(3000);
    if (caughtItem === "nothing") {
        console.log(`${interaction.user.displayName} (${interaction.user.id}) went fishing and got nothing.`);
        return interaction.editReply(`You waited around, but didn't catch anything...`);
    }
    if (caughtItem === "09LE001" && (rod.itemid === "11CO001" || rod.itemid === "11CO002")) {
        const rodRow = await interaction.client.db.inventory.findOne({
            where: { userid: interaction.user.id, itemid: rod.itemid }
        })
        await removeAmountFromInventory(interaction.client.db.equipment, rodRow, 1);
        console.log(`${interaction.user.displayName} (${interaction.user.id}) went fishing and got their rod broken by Jeff.`);
        return interaction.editReply(`You caught something huge! But it was so big that it snapped your fishing rod and swam away... (-1 ${rod.name})`);
    }
    caughtItem = interaction.client.itemCache.find((i) => i.itemid === caughtItem);
    await addAmountToInventory(interaction.client.db.inventory, interaction.user.id, caughtItem, 1);
    await interaction.editReply(`You caught 1 ${caughtItem.name} ${caughtItem.emoji}!`);
    console.log(`${interaction.user.displayName} (${interaction.user.id}) went fishing and got ${caughtItem.name}.`)
}