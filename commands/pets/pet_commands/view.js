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

// const avatarWheelBuilder = () => {
//     const actionRow = new ActionRowBuilder();
//     const fiveFiles = [];
//     const container = new ContainerBuilder().setAccentColor(0x80aaff);
//     for (let i = 0; i < 5; i++) {
//         fiveFiles.push(new AttachmentBuilder(`assets/${files[index + i]}`, { name: files[index + i] }));
//         container.addSectionComponents((section) => section
//             .setThumbnailAccessory((tn) => tn.setURL(`attachment://${files[index + i]}`))
//             .addTextDisplayComponents((t) => t.setContent(`Avatar #${index + i + 1}`)));
//         actionRow.addComponents(new ButtonBuilder().setCustomId(`choose_${files[index + i]}`).setLabel(`Choose Avatar #${index + i + 1}`).setStyle(ButtonStyle.Primary));
//     }
//     container.addActionRowComponents((r) => r.addComponents(...actionRow.components));
//     return { container, fiveFiles };
// };
// const { container, fiveFiles } = avatarWheelBuilder();
// await msg.edit({ components: [container], files: fiveFiles, flags: MessageFlags.IsComponentsV2 });
// console.log(files);

// ts might be worse
async function changeAvatar(otherI, collectorFilter) {
    await otherI.deferUpdate();
    let msg = await otherI.followUp("Loading...");
    let files = await readdir(assetsDir);
    files = files.filter(f => f.includes("jeff"));
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
                new ButtonBuilder().setCustomId("next").setLabel(`Page ${currentPage + 1} ->`).setStyle(ButtonStyle.Secondary).setDisabled(currentPage === Math.ceil(files.length / 5)),
                new ButtonBuilder().setCustomId("last").setLabel(`Page ${Math.ceil(files.length / 5)} >>`).setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("cancel").setLabel(`Cancel`).setStyle(ButtonStyle.Danger)
            )
            // build the 5 embeds containing the 5 files, and add buttons for selecting each avatar and scrolling through pages
            return { embeds, fiveFiles, actionRow, actionRowTwo };
        }

        const { embeds, fiveFiles, actionRow, actionRowTwo } = avatarWheelBuilder();
        await msg.edit({
            content: `Page ${currentPage}`,
            embeds: embeds,
            files: fiveFiles,
            components: [actionRow, actionRowTwo]
        });
        const collector = msg.createMessageComponentCollector({
            filter: collectorFilter,
            time: 240_000,
        });
        // simple collector
        collector.on("collect", async i => {
            await i.update({ content: "Loading....", });
            if (i.customId === "first") {
                index = 0;
                currentPage = Math.floor(index / 5) + 1;
            } else if (i.customId === "previous") {
                index = Math.max(0, index - 5);

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
            const { embeds, fiveFiles, actionRow, actionRowTwo } = avatarWheelBuilder();
            await i.editReply({
                content: `Page ${currentPage}`,
                embeds: embeds,
                files: fiveFiles,
                components: [actionRow, actionRowTwo]
            });
        })
        collector.on("end", async (_collected, reason) => {
            await msg.delete();
            resolve(null);
        });
    });
}

export const data = new SlashCommandSubcommandBuilder()
    .setName('view')
    .setDescription('Check up on your pet!');
export async function execute(interaction) {
    const user_id = interaction.user.id;
    const pet = await interaction.client.db.pets.findOne({
        where: { userid: user_id }
    });
    if (!pet) return interaction.reply({ content: `You don't have a pet yet! But rumor has it if you fish up something unknown and use it, you might just find a feisty companion.`, flags: MessageFlags.Ephemeral });
    const petLevel = calculateLevelInfo(pet.xp);
    await updatePetStats(pet, petLevel.level);
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
                new ButtonBuilder().setCustomId('avatar').setLabel('Change Avatar').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('perks').setLabel('See Level Perks').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('close').setLabel('Close Dialog').setStyle(ButtonStyle.Danger)
            ));
        return { container, file };
    }
    // I HATE JAVASCRIPT
    const { container, file } = buildContainer();
    const msg = await interaction.reply({ components: [container], files: [file], flags: MessageFlags.IsComponentsV2 });
    const collectorFilter = i => i.user.id === interaction.user.id;
    const collector = msg.createMessageComponentCollector({
        filter: collectorFilter,
        time: 120_000,
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
            console.log("tost");
            if (fileName) {
                pet.picture = fileName;
                await pet.save();
            }
        } else if (i.customId === "perks") {
            await i.deferUpdate();
            await i.followUp({
                content: `Level 1: Base Stats
Level 2: +20% Slower Hunger/Affection Decay, +20% Move Power
Level 3: +30% Slower Hunger/Affection Decay, +30% Move Power
Level 4: +40% Slower Hunger/Affection Decay, +40% Move Power
Level 5: +50% Slower Hunger/Affection Decay, +50% Move Power
Level 6: +60% Slower Hunger/Affection Decay, +60% Move Power
Level 7: +70% Slower Hunger/Affection Decay, +70% Move Power
Level 8: +80% Slower Hunger/Affection Decay, +80% Move Power
Level 9: +90% Slower Hunger/Affection Decay, +90% Move Power
Level 10: +100% Slower Hunger/Affection Decay, +100% Move Power`, flags: MessageFlags.Ephemeral })
        } else if (i.customId === "close") return collector.stop("close");
        const { container, file } = buildContainer();
        await i.editReply({ components: [container], files: [file], flags: MessageFlags.IsComponentsV2 });
    })
    collector.on("end", async (_collected, reason) => {
        await msg.delete();
    });
}   
