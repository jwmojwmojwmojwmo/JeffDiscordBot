import { ButtonBuilder, ButtonStyle, SlashCommandBuilder, escapeMarkdown, ContainerBuilder, AttachmentBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageFlags, heading, italic } from 'discord.js';
import { Op } from 'sequelize';
import { getUserAndUpdate, getPetLevel, renderUsername, updatePetStats } from '../../helpers/utils.js';

const timeoutContainer = new ContainerBuilder()
    .addTextDisplayComponents((text) => text.setContent(`This interaction timed out.`));

async function buildContainer(db, pfp, user_name, user, userId, itemCache) {
    const titles = await getAvailableTitles(db, user, itemCache);
    const title = titles.find(i => i.title === user.title);
    const rankText = `${user.title}\n${italic(title.description)}`;
    let container = new ContainerBuilder()
        .addSectionComponents((section) => section
            .setThumbnailAccessory((thumbnail) => thumbnail.setURL(pfp))
            .addTextDisplayComponents((text) => text
                .setContent(`${heading(`${user_name}'s Profile`, 2)}\nTimes nommed: ${user.num_nommed}\nEnergy: ${user.energy}\nReputation: ${user.reputation}`)))
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((text) => text
            .setContent(`${heading(`${user_name}'s Title`, 3)}\n${rankText}`))
        .addSeparatorComponents((separator) => separator);
    if (user.pet) {
        const fileName = user.pet.picture;
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
    } else {
        container.addTextDisplayComponents((text) => text
            .setContent(`${heading(`${user_name}'s Pet`, 3)}\nThis user does not have a pet yet!`));
    }
    if (userId === user.userid) {
        container
            .addSeparatorComponents((separator) => separator)
            .addTextDisplayComponents((text) => text.setContent(`${heading(`Change Title`, 3)}`));
        container.addActionRowComponents((row) => row
            .setComponents(new StringSelectMenuBuilder()
                .setCustomId('change_title')
                .setPlaceholder('Change Title')
                .addOptions(
                    titles.map(title => new StringSelectMenuOptionBuilder()
                        .setLabel(title.title)
                        .setValue(title.title)
                        .setDescription(title.description + "\n" + `Requirement: ${title.required}`))
                )));
    }
    container
        .addActionRowComponents((row) => row.addComponents(
            new ButtonBuilder().setCustomId('close').setLabel('Close Profile').setStyle(ButtonStyle.Danger)));
    return container;
}

// TODO: ADD TRADABLE TITLES AND FIGURE OUT HOW TO SHOVE THEM IN HERE
// ADD TO itemlist.js:
// 8x - titles
//      81 - trader given
async function getAvailableTitles(db, user, itemCache) {
    // a title consists of a string (title), flavour text, and requirements 
    const titles = [];
    titles.push({ title: "🪣 Chum", description: "Jeff thinks you're alright.", required: "No requirements!" });
    const titlesInventory = await db.inventory.findAll({
        where: {
            userid: user.userid,
            itemid: {
                [Op.startsWith]: "81"
            }
        }
    });
    for (const title of titlesInventory) {
        const item = itemCache.find(i => i.itemid === title.itemid);
        titles.push({ title: item.name, description: item.description, required: "Purchased from trader" });
    }
    let rank = await db.jeff.count({
        where: {
            reputation: {
                [Op.gt]: user.reputation
            }
        }
    });
    rank++;
    if (rank === 1 && user.reputation > 250) {
        titles.push({ title: "👑 Landshark Prime", description: "The closest anyone gets to becoming Jeff's favorite.", required: "Top 1 Global" });
    }
    if (user.reputation >= 250) {
        titles.push({ title: "🌊 Leviathan", description: "A legend even Jeff would stop to admire.", required: "250+ Reputation" });
    }
    if (user.reputation >= 150) {
        titles.push({ title: "🏔️ Apex", description: "The kind of teammate Jeff would follow.", required: "150+ Reputation" });
    }
    if (user.reputation >= 50) {
        titles.push({ title: "🦈 Predator", description: "Consistently ahead of the pack.", required: "50+ Reputation" });
    }
    if (user.reputation >= 15) {
        titles.push({ title: "🦴 Scavenger", description: "Trusted to sniff out the good stuff.", required: "15+ Reputation" });
    }
    return titles;
}

export const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Take a look at your profile or someone else\'s.')
    .addUserOption(option => option
        .setName('user')
        .setDescription('User that you want to see stats of'));
export async function execute(interaction) {
    const tbl = interaction.client.db;
    const pfp = interaction.options.getUser('user')?.displayAvatarURL() || interaction.user.displayAvatarURL() || interaction.member?.displayAvatarURL() || interaction.user.displayAvatarURL();
    const name = interaction.options.getMember('user')?.displayName || interaction.options.getUser('user')?.username || interaction.member?.displayName || interaction.user.displayName;
    const user = await getUserAndUpdate(tbl, interaction.options.getUser('user')?.id || interaction.user.id, name, true, true);
    const user_name = renderUsername(user, name);
    const container = await buildContainer(tbl, pfp, user_name, user, interaction.user.id, interaction.client.itemCache);
    let response;
    if (user.pet) {
        const file = new AttachmentBuilder(`assets/${user.pet.picture}`, { name: user.pet.picture });
        response = await interaction.reply({ components: [container], files: [file], flags: MessageFlags.IsComponentsV2 });
    } else {
        response = await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
    const collectionFilter = i => i.user.id === interaction.user.id;
    const collector = response.createMessageComponentCollector({ filter: collectionFilter, idle: 120000 });
    collector.on('collect', async i => {
        if (i.customId === "change_title") {
            user.title = i.values[0];
            await user.save();
            await i.deferUpdate();
            await i.followUp({ content: `Your title has been changed to ${user.title}. You may have to run /profile again to see the changes.`, flags: MessageFlags.Ephemeral });
        } else if (i.customId === "close") {
            await i.update({ components: [timeoutContainer], flags: MessageFlags.IsComponentsV2 });
            collector.stop("close");
            return;
        }
    });
    collector.on('end', async (_collected, reason) => {
        if (reason === "close") return interaction.deleteReply().catch(console.error());
        await interaction.editReply({ components: [timeoutContainer], flags: MessageFlags.IsComponentsV2 });
    })

}