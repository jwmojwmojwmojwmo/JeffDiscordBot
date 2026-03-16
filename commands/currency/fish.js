import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { setTimeout } from 'node:timers/promises';
import { addAmountToInventory, updatePetStats, getUserAndUpdate, removeAmountFromInventory, getPetLevel } from '../../helpers/utils.js';

const energyToFish = 5;
const fishingLootTables = {
    "HAND": [
        { itemid: "nothing", weight: 10 },    // 1chance to catch nothing
        { itemid: "03CO001", weight: 15 },    // seaweed  
        { itemid: "02CO001", weight: 60 },    // Driftwood
        { itemid: "01CO005", weight: 10 },    // Shrimp
        { itemid: "01CO001", weight: 5 }   // Common Fish
    ],
    // Old Fishing Rod
    "11CO001": [
        { itemid: "nothing", weight: 5 },
        { itemid: "02CO001", weight: 35 },    // Driftwood
        { itemid: "01CO005", weight: 10 },    // Shrimp
        { itemid: "01CO001", weight: 37.5 },  // Common Fish
        { itemid: "03CO001", weight: 10 },    // seaweed
        { itemid: "02RA002", weight: 2.4 },     // Scrap Metal
        { itemid: "09LE001", weight: 0.1 }    // Unknown Fish (Jeff)
    ],
    // Beginner Fishing Rod
    "11CO002": [
        { itemid: "01CO005", weight: 10 },    // Shrimp
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
        { itemid: "01RA002", weight: 25 },    // Rare Fish
        { itemid: "01EP003", weight: 25 },    // Epic Fish
        { itemid: "04EP003", weight: 20 },    // Giant Squid
        { itemid: "01LE004", weight: 10 },    // Legendary Fish
        { itemid: "09LE001", weight: 5 }      // Unknown Fish (Jeff)
    ]
};

const jeffFishingLootTables = [
    { itemid: "02RA002", weight: 10 },     // Scrap Metal
    { itemid: "01CO001", weight: 25 },    // Common Fish
    { itemid: "01RA002", weight: 15 },    // Rare Fish
    { itemid: "04RA102", weight: 15 },    // Octopus
    { itemid: "04RA101", weight: 10 },    // Crab
    { itemid: "01CO005", weight: 10 },    // Shrimp
    { itemid: "01EP003", weight: 10 },     // Epic Fish
    { itemid: "04EP003", weight: 5 },    // Giant Squid
]

export const cooldown = 20;
export const data = new SlashCommandBuilder()
    .setName('fish')
    .setDescription(`Go fishing for some goodies (costs ${energyToFish} energy)!`)
export async function execute(interaction) {
    const user = await getUserAndUpdate(interaction.client.db.jeff, interaction.user.id, interaction.member?.displayName || interaction.user.displayName, false);
    const pet = await interaction.client.db.pets.findByPk(interaction.user.id);
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
    let jeffCaughtItem;
    if (pet) {
        const xpLoss = await updatePetStats(pet, getPetLevel(pet.xp));
        if (xpLoss > 0) {
            await interaction.followUp({ content: `Oh no! While you were away, your pet's hunger and affection dropped to 0 for too long, losing ${xpLoss} XP. They were also too hungry to go fishing with you...`, flags: MessageFlags.Ephemeral });
        } else if (pet.hunger < 50) {
            await interaction.followUp({ content: `Your pet, ${pet.name}, was too hungry to go fishing with you... (50 hunger required)`, flags: MessageFlags.Ephemeral });
        } else {
            pet.hunger -= 10;
            pet.xp += 25;
            await pet.save();
            let roll = Math.random() * 100;
            jeffCaughtItem = jeffFishingLootTables[jeffFishingLootTables.length - 1].itemid;
            for (const drop of jeffFishingLootTables) {
                if (roll <= drop.weight) {
                    jeffCaughtItem = drop.itemid;
                    break;
                }
                roll -= drop.weight;
            }
        }
    }
    await setTimeout(3000);
    if (caughtItem === "nothing") {
        console.log(`${interaction.user.displayName} (${interaction.user.id}) went fishing and got nothing.`);
        await interaction.editReply(`You waited around, but didn't catch anything...`);
    } else if (caughtItem === "09LE001" && (rod.itemid === "11CO001" || rod.itemid === "11CO002")) {
        const rodRow = await interaction.client.db.inventory.findOne({
            where: { userid: interaction.user.id, itemid: rod.itemid }
        })
        await removeAmountFromInventory(interaction.client.db.equipment, rodRow, 1);
        console.log(`${interaction.user.displayName} (${interaction.user.id}) went fishing and got their rod broken by Jeff.`);
        await interaction.editReply(`You caught something huge! But it was so big that it snapped your fishing rod and swam away... (-1 ${rod.name})`);
    } else {
        caughtItem = interaction.client.itemCache.find((i) => i.itemid === caughtItem);
        await addAmountToInventory(interaction.client.db.inventory, interaction.user.id, caughtItem, 1);
        await interaction.editReply(`You caught 1 ${caughtItem.name} ${caughtItem.emoji}!`);
        console.log(`${interaction.user.displayName} (${interaction.user.id}) went fishing and got ${caughtItem.name} ${caughtItem.itemid}.`);
    }
    if (jeffCaughtItem) {
        jeffCaughtItem = interaction.client.itemCache.find((i) => i.itemid === jeffCaughtItem);
        await addAmountToInventory(interaction.client.db.inventory, interaction.user.id, jeffCaughtItem, 1);
        await interaction.followUp(`Your pet followed you and went fishing with you! They caught 1 ${jeffCaughtItem.name} ${jeffCaughtItem.emoji}! (-10 hunger) (+25 xp)`);
        console.log(`${interaction.user.displayName} (${interaction.user.id})'s pet got ${jeffCaughtItem.name}.`);
    }
}