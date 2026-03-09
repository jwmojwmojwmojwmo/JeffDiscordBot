import { SlashCommandSubcommandBuilder, MessageFlags, escapeMarkdown, heading, ContainerBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputStyle, LabelBuilder, TextInputBuilder, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { getUserAndUpdate, updatePetStats } from '../../../helpers/utils.js';
import { readdir } from 'fs/promises';
import { join } from 'node:path';

const assetsDir = join(process.cwd(), 'assets');

function calculateLevelInfo(totalXp) {
    const C = 100; // how fast you level up
    const MAX_LEVEL = 10;

    // Calculate current level based on total XP
    let level = Math.floor(Math.sqrt(totalXp / C)) + 1;
    level = Math.min(level, MAX_LEVEL);

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

async function changeAvatar(i, collectorFilter) {
    await i.deferUpdate();
    let msg = await i.followUp("Loading...");
    let files = await readdir(assetsDir);
    files = files.filter(f => f !== "Jwmologo.png");
    let index = 0;
    let currentPage = Math.floor(index / 5) + 1;
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
        return { embeds, fiveFiles, actionRow };
    }
    const { embeds, fiveFiles, actionRow } = avatarWheelBuilder();
    const actionRowTwo = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("first").setLabel(`<< Page 1`).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("previous").setLabel(`<- Page ${currentPage - 1}`).setStyle(ButtonStyle.Secondary).setDisabled(currentPage === 1),
        new ButtonBuilder().setCustomId("next").setLabel(`Page ${currentPage + 1} ->`).setStyle(ButtonStyle.Secondary).setDisabled(currentPage === Math.ceil(files.length / 5)),
        new ButtonBuilder().setCustomId("last").setLabel(`Page ${Math.ceil(files.length / 5)} >>`).setStyle(ButtonStyle.Secondary)
    )
    await msg.edit({
        content: "",
        embeds: embeds,
        files: fiveFiles,
        components: [actionRow, actionRowTwo]
    });
}

export const data = new SlashCommandSubcommandBuilder()
    .setName('view')
    .setDescription('Check up on your pet!');
export async function execute(interaction) {
    const user_id = interaction.user.id;
    const user = await getUserAndUpdate(interaction.client.db.jeff, user_id, interaction.member?.displayName || interaction.user.displayName, true);
    const pet = await interaction.client.db.pets.findOne({
        where: { userid: user_id }
    });
    if (!pet) return interaction.reply({ content: `You don't have a pet yet! But rumor has it if you fish up something unknown and use it, you might just find a feisty companion.`, flags: MessageFlags.Ephemeral });
    const petLevel = calculateLevelInfo(pet.xp);
    await updatePetStats(pet, petLevel.level);
    const fileName = pet.picture;
    const file = new AttachmentBuilder(`assets/${fileName}`, { name: fileName });
    const xpBar = generateProgressBar(petLevel.current, petLevel.next, '🟩');
    const hungerBar = generateProgressBar(pet.hunger, 100, '🐟');
    const affectionBar = generateProgressBar(pet.affection, 100, '❤️');
    const buildContainer = () => new ContainerBuilder()
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
    const msg = await interaction.reply({ components: [buildContainer()], files: [file], flags: MessageFlags.IsComponentsV2 });
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
            await i.editReply({ components: [buildContainer()], files: [file], flags: MessageFlags.IsComponentsV2 });
        }
        if (i.customId === "avatar") {
            const fileName = await changeAvatar(i, collectorFilter);
        }
    })
}   
