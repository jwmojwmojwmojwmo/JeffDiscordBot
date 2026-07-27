import { SlashCommandBuilder, escapeMarkdown, ContainerBuilder, AttachmentBuilder, MessageFlags, heading, italic } from 'discord.js';
import { Op } from 'sequelize';
import { getUserAndUpdate, getPetLevel, updatePetStats } from '../../helpers/utils.js';

async function getRankText(db, user) {
    let rank = await db.jeff.count({
        where: {
            reputation: {
                [Op.gt]: user.reputation
            }
        }
    });
    rank++;
    let rankTitle;
    let embedColor;
    let text;
    if (rank === 1 && user.reputation > 250) {
        rankTitle = "👑 Landshark Prime";
        embedColor = 0xffd700; // Gold
        text = "The closest anyone gets to becoming Jeff's favorite.";
    } else if (user.reputation >= 250) {
        rankTitle = "🌊 Leviathan";
        embedColor = 0x9932cc; // Deep Purple
        text = "A legend even Jeff would stop to admire.";
    } else if (user.reputation >= 150) {
        rankTitle = "🏔️ Apex";
        embedColor = 0x1e90ff; // Blue
        text = "The kind of teammate Jeff would follow.";
    } else if (user.reputation >= 50) {
        rankTitle = "🦈 Predator";
        embedColor = 0xff8c00; // Dark Orange
        text = "Consistently ahead of the pack.";
    } else if (user.reputation >= 15) {
        rankTitle = "🦴 Scavenger";
        embedColor = 0x00ff00; // Green
        text = "Trusted to sniff out the good stuff.";
    } else {
        rankTitle = "🪣 Chum";
        embedColor = 0x808080; // Gray
        text = "Jeff thinks you're alright.";
    }
    return {
        rankText: `Global Rank: #${rank}\nTitle: ${rankTitle}\n${italic(text)}`,
        embedColour: embedColor
    };
}

// TODO: add autofill/default values
export const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Take a look at your profile or someone else\'s.')
    .addUserOption(option => option
        .setName('user')
        .setDescription('User that you want to see stats of'));
export async function execute(interaction) {
    const tbl = interaction.client.db;
    const pfp = interaction.options.getUser('user')?.displayAvatarURL() || interaction.user.displayAvatarURL() || interaction.member?.displayAvatarURL() || interaction.user.displayAvatarURL();
    let user_name = interaction.options.getMember('user')?.displayName || interaction.options.getUser('user')?.username || interaction.member?.displayName || interaction.user.displayName;
    const user = await getUserAndUpdate(tbl, interaction.options.getUser('user')?.id || interaction.user.id, user_name, true, true);
    user_name = escapeMarkdown(user_name);
    const { rankText, embedColour } = await getRankText(tbl, user);
    const container = new ContainerBuilder()
        .setAccentColor(embedColour)
        .addSectionComponents((section) => section
            .setThumbnailAccessory((thumbnail) => thumbnail.setURL(pfp))
            .addTextDisplayComponents((text) => text
                .setContent(`${heading(`${user_name}'s Profile`, 2)}\nTimes nommed: ${user.num_nommed}\nEnergy: ${user.energy}\nReputation: ${user.reputation}`)))
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((text) => text
            .setContent(`${heading(`${user_name}'s Rank`, 3)}\n${rankText}`))
        .addSeparatorComponents((separator) => separator)
    if (user.pet) {
        const fileName = user.pet.picture;
        const file = new AttachmentBuilder(`assets/${fileName}`, { name: fileName });
        const petLevel = getPetLevel(user.pet.xp);
        await updatePetStats(user.pet, petLevel);
        const mood = user.pet.hunger + user.pet.affection;

        let status;
        if (mood >= 180) status = "Living the Dream";
        else if (mood >= 150) status = "Fin-tastically Vibing";
        else if (mood >= 120) status = "Content & Cozy";
        else if (mood >= 90) status = "Curious";
        else if (mood >= 60) status = "Looking for Snacks";
        else if (mood >= 30) status = "Hangry";
        else status = "Causing Trouble";
        container.addSectionComponents((section) => section
            .setThumbnailAccessory((thumbnail) => thumbnail.setURL(`attachment://${fileName}`))
            .addTextDisplayComponents((text) => text
                .setContent(`${heading(`${user_name}'s Pet`, 3)}\nName: ${user.pet.name}\nLevel: ${petLevel}\nMood: ${status}`)));
        await interaction.reply({ components: [container], files: [file], flags: MessageFlags.IsComponentsV2 });
    } else {
        container.addTextDisplayComponents((text) => text
            .setContent(`${heading(`${user_name}'s Pet`, 3)}\nThis user does not have a pet yet!`));
        await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
}