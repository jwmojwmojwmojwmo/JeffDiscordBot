import { SlashCommandSubcommandBuilder, MessageFlags, escapeMarkdown, heading, ContainerBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputStyle, LabelBuilder, TextInputBuilder, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { getPetLevel, getUserAndUpdate, updatePetStats } from '../../../helpers/utils.js';
import { readdir } from 'fs/promises';
import { join } from 'node:path';

const assetsDir = join(process.cwd(), 'assets');

function calculateLevelInfo(totalXp) {
    const C = 100;
    const level = getPetLevel(totalXp);
    const MAX_LEVEL = 10;

    // Calculate the XP thresholds (based on algebruh)
    const currentLevelTotalXpRequired = Math.pow(level - 1, 2) * C;
    const nextLevelTotalXpRequired = Math.pow(level, 2) * C;

    const xpIntoCurrentLevel = totalXp - currentLevelTotalXpRequired;
    const xpNeededForNextLevel = nextLevelTotalXpRequired - currentLevelTotalXpRequired;

    return {
        level: level,
        current: xpIntoCurrentLevel,
        next: xpNeededForNextLevel,
        isMaxLevel: level === MAX_LEVEL
    };
}

function generateProgressBar(current, max, filledChar) {
    const emptyChar = '🔳';
    if (max === 0) return emptyChar.repeat(10);
    const length = 10;
    const safeCurrent = Math.min(Math.max(0, current), max);
    const filledCount = Math.round((safeCurrent / max) * length);
    const emptyCount = length - filledCount;
    return filledChar.repeat(filledCount) + emptyChar.repeat(emptyCount);
}

async function renamePet(i, collectorFilter) {
    const modal = new ModalBuilder().setCustomId("modal").setTitle("Changing Name");
    const nameInput = new TextInputBuilder().setCustomId("name").setStyle(TextInputStyle.Short).setPlaceholder("Jeff");
    const label = new LabelBuilder().setLabel("Enter new name for your pet!").setTextInputComponent(nameInput);
    modal.addLabelComponents(label);
    await i.showModal(modal);
    try {
        const response = await i.awaitModalSubmit({ filter: collectorFilter, time: 120_000 });
        if (response) {
            await response.deferUpdate();
            return response.fields.getTextInputValue("name");
        } else {
            return null;
        }
    }
    catch (error) {
        // user cancelled modal or took too long, just pass
        console.log(error);
        return null;
    }
}

// ts might be worse
async function changeAvatar(otherI, collectorFilter) {
    await otherI.deferUpdate();
    let msg = await otherI.followUp("Loading...");
    let files = await readdir(assetsDir);
    files = files.filter(f => f.includes("jeff"));
    files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })); // so it goes jeff1 -> jeff2 not jeff1 -> jeff 10
    let index = 0;
    let currentPage = Math.floor(index / 5) + 1;
    // wrap in promise to block everything
    return new Promise(async resolve => {
        const avatarWheelBuilder = () => {
            const embeds = [];
            const fiveFiles = [];
            const actionRow = new ActionRowBuilder();
            for (let i = 0; i < 5; i++) {
                const fileName = files[index + i];
                if (!fileName) break;
                fiveFiles.push(new AttachmentBuilder(`assets/${fileName}`, { name: fileName }));
                // Create a simple embed for each shark
                const embed = new EmbedBuilder()
                    .setTitle(`Avatar #${index + i + 1}`)
                    .setThumbnail(`attachment://${fileName}`)
                    .setColor(0x80aaff);
                embeds.push(embed);
                // Create the corresponding button
                const btn = new ButtonBuilder()
                    .setCustomId(`select_${fileName}`)
                    .setLabel(`Select Avatar #${index + i + 1}`)
                    .setStyle(ButtonStyle.Primary);
                actionRow.addComponents(btn);
            }
            const actionRowTwo = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("first").setLabel(`<< Page 1`).setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("previous").setLabel(`<- Page ${currentPage - 1}`).setStyle(ButtonStyle.Secondary).setDisabled(currentPage === 1),
                new ButtonBuilder().setCustomId("choose").setLabel("Choose Page").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("next").setLabel(`Page ${currentPage + 1} ->`).setStyle(ButtonStyle.Secondary).setDisabled(currentPage === Math.ceil(files.length / 5)),
                new ButtonBuilder().setCustomId("last").setLabel(`Page ${Math.ceil(files.length / 5)} >>`).setStyle(ButtonStyle.Secondary)
            )
            const cancelRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("cancel").setLabel(`Cancel`).setStyle(ButtonStyle.Danger));
            // build the 5 embeds containing the 5 files, and add buttons for selecting each avatar and scrolling through pages
            return { embeds, fiveFiles, actionRow, actionRowTwo, cancelRow };
        }

        const { embeds, fiveFiles, actionRow, actionRowTwo, cancelRow } = avatarWheelBuilder();
        await msg.edit({
            content: `Page ${currentPage}`,
            embeds: embeds,
            files: fiveFiles,
            components: [actionRow, actionRowTwo, cancelRow]
        });
        const collector = msg.createMessageComponentCollector({
            filter: collectorFilter,
            time: 240_000,
        });
        // simple collector
        collector.on("collect", async i => {
            if (i.customId !== "choose") await i.update({ content: "Loading....", }); // cuz modals SUCK they have to be first greedy bastards
            if (i.customId === "first") {
                index = 0;
                currentPage = Math.floor(index / 5) + 1;
            } else if (i.customId === "previous") {
                index = Math.max(0, index - 5);
            } else if (i.customId === "choose") {
                const page = await choosePage(i, collectorFilter, files);
                if (page) {
                    await i.editReply({ content: "Loading....", });
                    index = (page - 1) * 5;
                } else {
                    return i.followUp({ content: `You entered an invalid page number!`, flags: MessageFlags.Ephemeral });
                }
            } else if (i.customId === "next") {
                index = Math.min(files.length - 1, index + 5);
                currentPage = Math.floor(index / 5) + 1;
            } else if (i.customId === "last") {
                index = files.length - (files.length % 5 || 5)
                currentPage = Math.floor(index / 5) + 1;
            } else if (i.customId === "cancel") {
                collector.stop("cancelled");
                resolve(null);
                return;
            } else if (i.customId.startsWith("select")) {
                collector.stop("chosen");
                resolve(i.customId.split("_")[1]);
                return;
            }
            currentPage = Math.floor(index / 5) + 1;
            const { embeds, fiveFiles, actionRow, actionRowTwo, cancelRow } = avatarWheelBuilder();
            await i.editReply({
                content: `Page ${currentPage}`,
                embeds: embeds,
                files: fiveFiles,
                components: [actionRow, actionRowTwo, cancelRow]
            });
        })
        collector.on("end", async (_collected, reason) => {
            if (reason === "time") await msg.edit({content: `This interaction timed out.`, embeds: [], files: [], components: []});
            await msg.delete().catch(console.error);
            resolve(null);
        });
    });
}

// helper function to choose specific page
async function choosePage(i, collectorFilter, files) {
    const modal = new ModalBuilder().setCustomId("modal").setTitle("Choosing Page");
    const nameInput = new TextInputBuilder().setCustomId("page").setStyle(TextInputStyle.Short).setPlaceholder("1");
    const label = new LabelBuilder().setLabel("Choose a page to go to...").setTextInputComponent(nameInput);
    modal.addLabelComponents(label);
    await i.showModal(modal);
    try {
        const response = await i.awaitModalSubmit({ filter: collectorFilter, time: 120_000 });
        if (response) {
            await response.deferUpdate();
            const page = parseInt(response.fields.getTextInputValue("page"));
            if (page < 1 || page > Math.ceil(files.length / 5)) {
                return null;
            }
            return page;
        } else {
            return null;
        }
    } catch (error) {
        // user cancelled modal or took too long, just pass
        console.log(error);
        return null;
    }
}
export const data = new SlashCommandSubcommandBuilder()
    .setName('view')
    .setDescription('Check up on your pet!');
export async function execute(interaction, pet) {
    let petLevel = calculateLevelInfo(pet.xp);
    const xpLoss = await updatePetStats(pet, petLevel.level);
    if (xpLoss > 0) petLevel = calculateLevelInfo(pet.xp);
    const xpBar = generateProgressBar(petLevel.current, petLevel.next, '🟩');
    const hungerBar = generateProgressBar(pet.hunger, 100, '🐟');
    const affectionBar = generateProgressBar(pet.affection, 100, '❤️');
    const buildContainer = () => {
        const fileName = pet.picture;
        const file = new AttachmentBuilder(`assets/${fileName}`, { name: fileName });
        const container = new ContainerBuilder()
            .setAccentColor(0x80aaff)
            .addSectionComponents((section) => section
                .addTextDisplayComponents((text) => text.setContent(`${heading(`${escapeMarkdown(pet.name)}`, 2)}\nLevel ${petLevel.level} Landshark\nXP: ${petLevel.current}/${petLevel.next}\n${xpBar}`))
                .setThumbnailAccessory((thumbnail) => thumbnail.setURL(`attachment://${fileName}`)))
            .addSeparatorComponents((separator) => separator)
            .addTextDisplayComponents((text) => text.setContent(`Hunger: ${pet.hunger}/100\n${hungerBar}`))
            .addTextDisplayComponents((text) => text.setContent(`Affection: ${pet.affection}/100\n${affectionBar}`))
            .addSeparatorComponents((separator) => separator)
            .addActionRowComponents((row) => row.addComponents(
                new ButtonBuilder().setCustomId('rename').setLabel('Rename').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('avatar').setLabel(`Change Avatar (Current: #${pet.picture.split(".")[0].split("jeff")[1]})`).setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('perks').setLabel('See Level Perks').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('close').setLabel('Close Dialog').setStyle(ButtonStyle.Danger)
            ));
        return { container, file };
    }
    // I HATE JAVASCRIPT
    const { container, file } = buildContainer();
    const msg = await interaction.reply({ components: [container], files: [file], flags: MessageFlags.IsComponentsV2 });
    if (xpLoss > 0) await interaction.followUp({ content: `Oh no! While you were away, your pet's hunger and affection dropped to 0 for too long, losing ${xpLoss} XP. Spend some time with your buddy!`, flags: MessageFlags.Ephemeral });
    const collectorFilter = i => i.user.id === interaction.user.id;
    const collector = msg.createMessageComponentCollector({
        filter: collectorFilter,
        time: 240_000,
    });
    collector.on("collect", async i => {
        if (i.customId === "rename") {
            const newName = await renamePet(i, collectorFilter);
            if (newName) {
                pet.name = newName;
                await pet.save();
            }
        } else if (i.customId === "avatar") {
            const fileName = await changeAvatar(i, collectorFilter);
            if (fileName) {
                pet.picture = fileName;
                await pet.save();
            }
        } else if (i.customId === "perks") {
            await i.deferUpdate();
            await i.followUp({
                content: `Level 1: Base Stats
Level 2: +25% Slower Hunger/Affection Decay, +100% Nom, Bubble, Spit Power
Level 3: +50% Slower Hunger/Affection Decay, +200% Nom, Bubble, Spit Power
Level 4: +75% Slower Hunger/Affection Decay, +300% Nom, Bubble, Spit Power
Level 5: +100% Slower Hunger/Affection Decay, +400% Nom, Bubble, Spit Power
Level 6: +125% Slower Hunger/Affection Decay, +500% Nom, Bubble, Spit Power
Level 7: +150% Slower Hunger/Affection Decay, +600% Nom, Bubble, Spit Power
Level 8: +175% Slower Hunger/Affection Decay, +700% Nom, Bubble, Spit Power
Level 9: +200% Slower Hunger/Affection Decay, +800% Nom, Bubble, Spit Power
Level 10: +300% Slower Hunger/Affection Decay, +1000% Nom, Bubble, Spit Power`, flags: MessageFlags.Ephemeral
            })
        } else if (i.customId === "close") return collector.stop("close");
        const { container, file } = buildContainer();
        await i.editReply({ components: [container], files: [file], flags: MessageFlags.IsComponentsV2 });
    })
    collector.on("end", async (_collected, reason) => {
        await msg.delete().catch(console.error); //pass, catch if message is already deleted or smth weird
    });
}   
