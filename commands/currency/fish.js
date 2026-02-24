import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { setTimeout } from 'node:timers/promises';

const fishingLootTables = {
    "HAND": [
        { itemid: "nothing", weight: 25 },    // 25% chance to catch absolutely nothing
        { itemid: "02CO001", weight: 65 },    // Driftwood
        { itemid: "01CO001", weight: 10 }   // Common Fish
    ],
    // Old Fishing Rod
    "11CO001": [
        { itemid: "nothing", weight: 15 },    // 15% fail rate
        { itemid: "02CO001", weight: 45 },    // Driftwood
        { itemid: "01CO001", weight: 37.5 },  // Common Fish
        { itemid: "02RA002", weight: 2 },     // Scrap Metal
        { itemid: "09LE001", weight: 0.5 }    // Rare Fish
    ],
    // Beginner Fishing Rod
    "11CO002": [
        { itemid: "nothing", weight: 10 },    // 10% fail rate
        { itemid: "01CO001", weight: 45 },    // Common Fish
        { itemid: "02CO001", weight: 30 },    // Driftwood
        { itemid: "02RA002", weight: 9 },     // Scrap Metal
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
        { itemid: "nothing", weight: 5 },     // 5% fail rate
        { itemid: "01RA002", weight: 40 },    // Rare Fish
        { itemid: "01EP003", weight: 30 },    // Epic Fish
        { itemid: "01LE004", weight: 15 },    // Legendary Fish
        { itemid: "09LE001", weight: 10 }      // Unknown Fish (Jeff)
    ]
};

export const cooldown = 15;
export const data = new SlashCommandBuilder()
    .setName('fish')
    .setDescription(`Go fishing for some goodies!`)
export async function execute(interaction) {
    let rod = await interaction.client.db.equipment.findOne({
        where: { userid: interaction.user.id, slot: "fishing_rod" }
    })
    if (!rod) {
        rod = { itemid: "HAND", name: "Hand" }
    } else {
        rod = interaction.client.itemCache.find((i) => i.itemid === rod.itemid);
    }
    await interaction.reply(`You started fishing with your ${rod.name}...\n (Tip: Run /use to equip another fishing rod in your inventory!)`);
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
    await interaction.editReply(`You caught a ${caughtItem}!`);
    console.log(`${interaction.user.username} (${interaction.user.id}) went fishing and got ${caughtItem}.`)
}