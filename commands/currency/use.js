import { SlashCommandBuilder, MessageFlags, ButtonStyle, ButtonBuilder, ActionRowBuilder, ContainerBuilder } from 'discord.js';
import { getUserAndUpdate, removeAmountFromInventory } from '../../helpers/utils.js';
import { setTimeout } from 'node:timers/promises';
import { Op, TimeoutError } from 'sequelize';

// "Move Name": (if positive then how much energy it takes, if negative how much wildness it gives him, if 0, he misses but gets dmg resistance
const jeffFightTable = Object.freeze({
    "Bite": 30,
    "Tail Smack": 30,
    "Splash": 45,
    "Aqua Burst": 70,
    "Roar": -30,
    "Hide And Seek": 0,
    "It's Jeff!": 200,
})

const yesButton = new ButtonBuilder()
    .setCustomId('yes')
    .setLabel('Yes')
    .setStyle(ButtonStyle.Secondary);
const noButton = new ButtonBuilder()
    .setCustomId('no')
    .setLabel('No')
    .setStyle(ButtonStyle.Secondary);
const wrestleButton = new ButtonBuilder()
    .setCustomId('wrestle')
    .setLabel('Wrestle')
    .setStyle(ButtonStyle.Primary);
const intimidateButton = new ButtonBuilder()
    .setCustomId('intimidate')
    .setLabel('Intimidate')
    .setStyle(ButtonStyle.Primary);
const invButton = new ButtonBuilder()
    .setCustomId('inventory')
    .setLabel('Inventory')
    .setStyle(ButtonStyle.Primary);
const fleeButton = new ButtonBuilder()
    .setCustomId('flee')
    .setLabel('Flee')
    .setStyle(ButtonStyle.Danger)

const askRow = new ActionRowBuilder().addComponents(yesButton, noButton);
const battleRow = new ActionRowBuilder().addComponents(wrestleButton, intimidateButton, invButton, fleeButton);
const disabledBattleRow = new ActionRowBuilder().addComponents(battleRow.components.map(b => ButtonBuilder.from(b).setDisabled(true)));

async function equipItem(tbl, item, user_id) {
    const currentEquip = await tbl.findOne({
        where: { userid: user_id, slot: item.effect.slot }
    });
    if (currentEquip && currentEquip.itemid === item.itemid) {
        await currentEquip.destroy();
        return false;
    }
    await tbl.upsert({
        userid: user_id,
        itemid: item.itemid,
        slot: item.effect.slot
    });
    return true;
}

async function consumeItem(interaction, item, itemRow) {
    const user = await getUserAndUpdate(interaction.client.db.jeff, interaction.user.id, interaction.member?.displayName || interaction.user.displayName, false);
    user[item.effect.stat] += item.effect.amount;
    await removeAmountFromInventory(interaction.client.db.equipment, itemRow, 1);
    await user.save();
    let msg = "";
    if (item.itemid.startsWith("91")) {
        msg += `You proudly present your ${item.name}. Word spreads about your award.`;
    } else {
        switch (item.itemid) {
            case "03CO001": // seaweed
                msg += `You ate the seaweed. It tasted horrible, but at least it was somewhat nutritious?`;
                break;
            case "01CO005": // shrimp
                msg += `You ate the shrimp raw. Don't worry, the ocean water naturally sanitizes it... probably. Either way, it goes down smooth and packed a ton of nutrition.`;
                break;
            default:
                msg += `You consumed the item. Why did you do that?`;
        }
    }
    return interaction.reply({ content: `${msg} (-1 ${item.name}) (${item.effect.amount < 0 ? "-" : "+"}${item.effect.amount} ${item.effect.stat})`, flags: MessageFlags.Ephemeral });
}

async function tameJeff(interaction, itemRow) {
    let msg = "You picked up the unknown fish and tried to use it. It looks...weird. It doesn't look like any fish you've seen before. In fact, it looks more like a shark. But as you examine it closer, you realise, this isn't any ordinary shark. This one...has legs?";
    await interaction.reply(msg);
    await setTimeout(4000);
    msg += "\n\nSuddenly, the shark twitches! Its beady eyes snap open, fixing on you with unnerving intelligence. It squirms in your grasp, then with a surprising burst of strength, leaps from your hands! It lands on the ground, turning to face you. A low growl rumbles from its throat. You must have angered it."
    await interaction.editReply(msg);
    await setTimeout(5000);
    msg += "\n\nDespite the menacing growl, it's oddly endearing, like a grumpy puppy. You can't help but feel a strange desire to tame this bizarre creature. But as you reach out a hand, it suddenly lunges, teeth bared!"
    await interaction.editReply(msg);
    await setTimeout(5000);
    const askMsg = await interaction.followUp({
        content: "The shark is trying to attack you. Would you like to try to tame this mysterious shark?\n\n**WARNING:** This is a boss fight! Your energy is your health bar: if it drops to 0, you pass out and the shark escapes. It is recommended to have **at least 600 energy** and **plenty of fish in your inventory** before attempting this.",
        components: [askRow],
        withResponse: true
    });
    const collectorFilter = i => i.user.id === interaction.user.id;
    try {
        const response = await askMsg.awaitMessageComponent({ filter: collectorFilter, time: 60000 });
        if ((response.customId === 'yes')) {
            const pet = await interaction.client.db.pets.findOne({
                where: { userid: interaction.user.id }
            });
            if (pet) {
                return response.update({ content: "You already have a pet! You must disown your current pet to try to tame another one.", components: [] });
            }
            await removeAmountFromInventory(interaction.client.db.equipment, itemRow, 1);
            await response.update({ content: "You try to tame the shark. But it seems angry, and wants a fight...", components: [] });
            await setTimeout(2000);
            await tameJeffGameplay(interaction, response);
        } else {
            return response.update({ content: "You decided to back out and stand down to the shark. The shark gives you a long, judgmental look before letting out a tiny huff and going back to sleep. It's still in your inventory, but it\'s definitely judging you now.", components: [] });
        }
    } catch (error) {
        console.log(error);
        await removeAmountFromInventory(interaction.client.db.equipment, itemRow, 1);
        const user = await getUserAndUpdate(interaction.client.db.jeff, interaction.user.id, interaction.member?.displayName || interaction.user.displayName, false);
        const lostEnergy = Math.min(user.energy, Math.max(70, Math.round(Math.random() * 100)));
        user.energy -= lostEnergy;
        await user.save();
        await askMsg.edit({ content: `You stood there thinking for too long. The shark was able to lunge onto you and bite you hard, making you lose some energy. Before you could react, it had already ran away, back into the water. (-1 Unknown Fish) (-${lostEnergy} energy)`, components: [] });
    }
}

// i'm gonna shoot myself ts pmoo
async function tameJeffGameplay(interaction, response) {
    let isGameOver = false;
    const user = await getUserAndUpdate(interaction.client.db.jeff, interaction.user.id, interaction.member?.displayName || interaction.user.displayName, false);
    const maxEnergy = user.energy;
    let jeffWildness = 250;
    let jeffUlt = 0;
    let jeffResistance = 0;
    let decAmount = 0;
    const collectorFilter = i => i.user.id === interaction.user.id;
    const executeJeffTurn = async (currI) => {
        if (isGameOver) return false;
        await currI.editReply({ content: generateMessage("Shark's Turn:", "...", jeffWildness, user.energy, maxEnergy, user.reputation), components: [disabledBattleRow] });
        await setTimeout(2000);
        if (isGameOver) return false;
        let action = getAction(jeffUlt);
        let dmg = jeffFightTable[action];
        if (dmg > 0) {
            user.energy = Math.max(0, user.energy - dmg);
            jeffUlt += dmg;
        } else if (dmg < 0) {
            jeffWildness += -dmg;
        } else {
            let newResistance = (jeffResistance === 0) ? 0.03 : jeffResistance * 1.7;
            jeffResistance = Math.min(0.70, newResistance);
        }
        if (action === "It's Jeff!") {
            jeffUlt = 0;
            let newResistance = (jeffResistance === 0) ? 0.1 : jeffResistance * 1.3;
            jeffResistance = Math.min(0.70, newResistance);
        }
        await currI.editReply({ content: generateMessage("Shark's Turn:", getActionMessage(action), jeffWildness, user.energy, maxEnergy, user.reputation), components: [disabledBattleRow] });
        //await currI.followUp({ content: `Logging purposes: JeffUlt = ${jeffUlt}, JeffResistance = ${jeffResistance}`, flags: MessageFlags.Ephemeral });
        await setTimeout(2000);
        if (isGameOver) return false;
        if (user.energy <= 0) return false;
        return true;
    }
    let survived = await executeJeffTurn(response);
    if (!survived) {
        await user.save();
        return response.editReply({ content: `Your energy dropped to 0 and you lost! The shark ran away while you were exhausted... (-1 Unknown Fish)`, components: [] });
    }
    await response.editReply({ content: generateMessage("Your Turn:", "...", jeffWildness, user.energy, maxEnergy, user.reputation), components: [battleRow] });
    const collector = response.message.createMessageComponentCollector({
        filter: collectorFilter,
        time: 600_000
    });
    collector.on('collect', async i => {
        if (isGameOver) return;
        await i.deferUpdate();
        if (i.customId === 'wrestle') {
            if (user.energy < 50) return i.followUp({ content: `You don't have enough energy for this! (Required: 50 energy)`, flags: MessageFlags.Ephemeral });
            decAmount = Math.round(15 * (1 - jeffResistance));
            user.energy -= 50;
            jeffWildness -= decAmount;
            await i.editReply({ content: generateMessage("Your Turn:", `You used Wrestle! (-50 energy) You managed to decrease the shark's anger by ${decAmount}!`, jeffWildness, user.energy, maxEnergy, user.reputation), components: [disabledBattleRow] });
        }
        if (i.customId === 'intimidate') {
            if (user.reputation < 15) return i.followUp({ content: `You aren't respected enough to scare the shark! (Required: 15 reputation)`, flags: MessageFlags.Ephemeral });
            jeffUlt = Math.max(0, jeffUlt - 70);
            jeffResistance *= 0.5;
            await i.editReply({ content: generateMessage("Your Turn:", "You used Intimidate! The shark temporarily lost its focus and lost some Ultimate charge and resistance as a result!", jeffWildness, user.energy, maxEnergy, user.reputation), components: [disabledBattleRow] });
        }
        if (i.customId === 'inventory') {
            await i.editReply({ content: generateMessage("Your Turn:", "...", jeffWildness, user.energy, maxEnergy, user.reputation), components: [disabledBattleRow] });
            const item_id = await jeffFightInventory(i, interaction);
            if (isGameOver) return;
            if (item_id === "CHEVY") {
                await i.editReply({ content: generateMessage("Your Turn:", "You opened your inventory but took so long that the shark decided to attack you again!", jeffWildness, user.energy, maxEnergy, user.reputation), components: [disabledBattleRow] });
                await setTimeout(2000);
            } else if (item_id === "CLOSE_INVENTORY") {
                await i.editReply({ content: generateMessage("Your Turn:", "...", jeffWildness, user.energy, maxEnergy, user.reputation), components: [battleRow] });
                return;
            } else {
                switch (item_id) {
                    case "01CO005":
                        decAmount = Math.round(5 * (1 - jeffResistance));
                        jeffWildness -= decAmount;
                        await i.editReply({ content: generateMessage("Your Turn:", `You threw a shrimp to the shark! It's small and kinda sad looking, but the shark eats it anyways. (-${decAmount} anger)`, jeffWildness, user.energy, maxEnergy, user.reputation), components: [disabledBattleRow] });
                        break;
                    case "01CO001":
                        decAmount = Math.round(10 * (1 - jeffResistance));
                        jeffWildness -= decAmount;
                        await i.editReply({ content: generateMessage("Your Turn:", `You threw a Common Fish to the shark! The shark greedily ate it, but seems to want more. (-${decAmount} anger)`, jeffWildness, user.energy, maxEnergy, user.reputation), components: [disabledBattleRow] });
                        break;
                    case "01RA002":
                        decAmount = Math.round(25 * (1 - jeffResistance));
                        jeffWildness -= decAmount;
                        await i.editReply({ content: generateMessage("Your Turn:", `You threw a Rare Fish to the shark! The shark gobbled it up happily. (-${decAmount} anger)`, jeffWildness, user.energy, maxEnergy, user.reputation), components: [disabledBattleRow] });
                        break;
                    case "01EP003":
                        decAmount = Math.round(45 * (1 - jeffResistance));
                        jeffWildness -= decAmount;
                        jeffResistance *= 0.7;
                        await i.editReply({ content: generateMessage("Your Turn:", `You threw an Epic Fish to the shark! The shark slurped it up and seems a bit calmer. (-${decAmount} anger) (Shark's resistance decreased!)`, jeffWildness, user.energy, maxEnergy, user.reputation), components: [disabledBattleRow] });
                        break;
                    case "01LE004":
                        decAmount = Math.round(75 * (1 - jeffResistance));
                        jeffWildness -= decAmount;
                        user.reputation += 3;
                        await i.editReply({ content: generateMessage("Your Turn:", `You threw a Legendary Fish to the shark! The shark looks at you in admiration before gratefully munching on it. (-${decAmount} anger) (+2 reputation)`, jeffWildness, user.energy, maxEnergy, user.reputation), components: [disabledBattleRow] });
                        break;
                }
                await setTimeout(2000);
            }
        }
        await setTimeout(2000);
        if (i.customId === 'flee') return collector.stop("flee");
        if (jeffWildness <= 0) return collector.stop("tame");
        await user.save();
        survived = await executeJeffTurn(i);
        if (!survived) return collector.stop("lost");
        await i.editReply({ content: generateMessage("Your Turn:", "...", jeffWildness, user.energy, maxEnergy, user.reputation), components: [battleRow] });
    });
    collector.on('end', async (_collected, reason) => {
        isGameOver = true;
        await user.save();
        if (reason === 'time') return response.editReply({ content: "Time's up! You took so long to calm down the shark that it was able to gain too much power. It charged up a powerful blast and knocked you down. By the time you caught your breath, it had already vanished back into the wild... (-1 Unknown Fish) ", components: [] });
        if (reason === "flee") return response.editReply({ content: "You backed away from the strange shark, dodging its sharp teeth. It turns around, growls at you one last time, and runs away surprisingly quickly, fleeing back to the water. (-1 Unknown Fish)", components: [] });
        if (reason === "tame") {
            await interaction.client.db.pets.create({
                userid: interaction.user.id
            })
            const user = await interaction.client.db.jeff.findByPk(interaction.user.id);
            user.reputation += 10;
            await user.save();
            console.log(`${interaction.user.username} (${interaction.user.id}) tamed a pet!`);
            return response.editReply({ content: `With its anger depleted, the fierce shark suddenly calms down. It lets out a soft, confused little growl, lowers its guard, and promptly trots over to nuzzle you. You've successfully tamed it! You decide to call him Jeff for now (you can always change this later!). Use /pet view to start interacting with him! (-1 Unknown Fish) (+10 reputation)`, components: [] });
        }
        if (reason === "lost") {
            console.log(`${interaction.user.username} (${interaction.user.id}) lost the Jeff fight...`);
            return response.editReply({ content: `Your energy dropped to 0 and you lost! The shark ran away while you were exhausted... (-1 Unknown Fish)`, components: [] });
        }
    })
}


// helper function to generate a health bar
function generateHealthBar(current, max, filledChar) {
    const emptyChar = '🔳';
    if (max == 0) {
        return emptyChar.repeat(10);
    }
    const length = 10;
    const safeCurrent = Math.min(Math.max(0, current), max);
    const filledCount = Math.round((safeCurrent / max) * length);
    const emptyCount = length - filledCount;
    return filledChar.repeat(filledCount) + emptyChar.repeat(emptyCount);
}

// helper function to generate message each turn
function generateMessage(titleText, actionText, jeffWildness, energy, maxEnergy, rep) {
    const wildBar = generateHealthBar(jeffWildness, 250, '🟥');
    const energyBar = generateHealthBar(energy, maxEnergy, '🟦');

    return `**${titleText}**\n\n${actionText}\n\n🦈 **Shark's Anger:** ${jeffWildness}/250\n${wildBar}\n\n⚡ **Your Energy:** ${energy}\n${energyBar}\n**Your Reputation:** ${rep}`;
}

// helper function to generate next action
function getAction(jeffUlt) {
    let action = Object.keys(jeffFightTable)[Math.floor(Math.random() * Object.keys(jeffFightTable).length)];
    if (jeffUlt < 100) {
        while (action === "It's Jeff!") {
            action = Object.keys(jeffFightTable)[Math.floor(Math.random() * Object.keys(jeffFightTable).length)];
        }
        return action;
    } else {
        const ultChance = 35 * Math.pow(1.03, jeffUlt - 100);
        if (Math.random() * 100 < ultChance) {
            return "It's Jeff!";
        }
        return action;
    }
}

// helper function to generate action message
function getActionMessage(action) {
    const dmg = jeffFightTable[action];
    let msg = (action === "It's Jeff!") ? "Shark used its ultimate ability: It's Jeff! (Shark's resistance increased!)" : `Shark used ${action}!`;
    if (dmg > 0) {
        msg += ` (-${dmg} energy)`;
    } else if (dmg < 0) {
        msg += ` (+${Math.abs(dmg)} anger)`;
    } else {
        msg += ` (Shark's resistance increased!)`
    }
    return msg;
}

// helper function to generate inventory 
async function jeffFightInventory(i, interaction) {
    const user_id = interaction.user.id;
    const userinv = await interaction.client.db.inventory.findAll({
        where: {
            userid: user_id,
            itemid: {
                [Op.startsWith]: "01"
            }
        }
    });
    const container = new ContainerBuilder();
    container.setAccentColor(0x80aaff);
    if (userinv.length === 0) {
        container.addTextDisplayComponents((text) => text.setContent("You don't have anything useable in your inventory!"));
    }
    for (const item of userinv) {
        let item_formatted = interaction.client.itemCache.find(i => i.itemid === item.itemid);
        container.addSectionComponents((s) => s
            .addTextDisplayComponents((text) => text.setContent(`${item_formatted.name}  ${item_formatted.emoji}   ─   ${item.amount}`))
            .setButtonAccessory((button) => button.setCustomId(`use_${item.itemid}`).setLabel(`Use 1 ${item_formatted.name}`).setStyle(ButtonStyle.Primary)))
            .addSeparatorComponents((separator) => separator);
    }
    container.addActionRowComponents((row) => row.addComponents(new ButtonBuilder().setCustomId("close").setLabel("Close Inventory").setStyle(ButtonStyle.Danger)));
    const invMsg = await i.followUp({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, withResponse: true });
    const collectorFilter = i => i.user.id === interaction.user.id;
    try {
        const response = await invMsg.awaitMessageComponent({ filter: collectorFilter, time: 30000 });
        if (response.customId.startsWith("use_")) {
            const item_id = response.customId.split("_")[1];
            const itemRow = await interaction.client.db.inventory.findOne({
                where: { userid: user_id, itemid: item_id }
            })
            await removeAmountFromInventory(interaction.client.db.equipment, itemRow, 1);
            await response.update({
                components: [new ContainerBuilder().addTextDisplayComponents((text) => text.setContent(`You threw the fish to the shark!`))],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
            });
            await i.webhook.deleteMessage(invMsg.id).catch(console.error);
            return item_id;
        }
        if (response.customId === "close") {
            await response.update({
                components: [new ContainerBuilder().addTextDisplayComponents((text) => text.setContent(`You closed the inventory.`))],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
            });
            await i.webhook.deleteMessage(invMsg.id).catch(console.error);
            return "CLOSE_INVENTORY";
        }
    } catch (error) {
        console.log(error);
        //await i.webhook.editMessage(invMsg.id, { components: [new ContainerBuilder().addTextDisplayComponents((text) => text.setContent("You took too long! The shark got impatient and attacked you!"))], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        await i.webhook.deleteMessage(invMsg.id).catch(console.error);
        return "CHEVY";
    }
}

export const data = new SlashCommandBuilder()
    .setName('use')
    .setDescription(`Use an item in your inventory (Use a currently equipped item to unequip it)`)
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
    console.log(`${interaction.user.displayName} (${interaction.user.id}) used ${item.name}.`);
    switch (item.effect?.type || 0) {
        case "FUNNY":
            await interaction.reply({ content: item.effect.message, flags: MessageFlags.Ephemeral });
            break;
        case "EQUIP":
            const equipped = await equipItem(interaction.client.db.equipment, item, interaction.user.id);
            await interaction.reply({ content: `You ${equipped ? "" : "un"}equipped ${item.name}.`, flags: MessageFlags.Ephemeral });
            break;
        case "CONSUME":
            await consumeItem(interaction, item, itemRow); // custom msg for each consumable so just let the helper handle it all
            break;
        case "JEFF_TAME_SCENE":
            await tameJeff(interaction, itemRow);
            break;
        default:
            await interaction.reply({ content: `You entered an invalid item or you can't use this item! If you believe this is in error, please report it!`, flags: MessageFlags.Ephemeral });
    }
}