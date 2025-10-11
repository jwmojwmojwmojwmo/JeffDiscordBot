const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { getUserAndUpdate } = require('../../utils.js');
const { ownerId } = require('../../config.json');

// constants for link buttons
const dailyRemindersButton = new ButtonBuilder()
    .setCustomId('dailyReminders')
    .setLabel('Toggle Daily Reminders')
    .setStyle(ButtonStyle.Primary);
const voteReminders = new ButtonBuilder()
    .setCustomId('voteReminders')
    .setLabel('Toggle Vote Reminders')
    .setStyle(ButtonStyle.Primary);
const DonateJeffDMButton = new ButtonBuilder()
    .setCustomId('donateJeffDM')
    .setLabel('Toggle Donate Jeff DMs')
    .setStyle(ButtonStyle.Primary);
const requestInfoButton = new ButtonBuilder()
    .setCustomId('requestInfo')
    .setLabel('Request User Information')
    .setStyle(ButtonStyle.Secondary);
const deleteInfoButton = new ButtonBuilder()
    .setCustomId('deleteInfo')
    .setLabel('Delete User Information')
    .setStyle(ButtonStyle.Danger);

const settingsRow = new ActionRowBuilder().addComponents(dailyRemindersButton, voteReminders, DonateJeffDMButton); // the row of buttons below the text
const utilSettingsRow = new ActionRowBuilder().addComponents(requestInfoButton, deleteInfoButton); // the row of buttons below the text

async function settingsFunction(tbl, interaction, user_id, user_name) {
    const buildEmbed = () =>
        new EmbedBuilder()
            .setTitle(`${user_name}'s Settings`)
            .addFields(
                {
                    name: `Daily Reminders - **${user.settings.dailyReminders}**`,
                    value: `Get a reminder every day if you forget /daily! (This feature is coming soon)`,
                },
                {
                    name: `Vote Reminders - **${user.settings.voteReminders}**`,
                    value: `Get reminded to vote for more rewards! (This feature is coming soon)`,
                },
                {
                    name: `Donate Jeff DMs - **${user.settings.donateJeffDM}**`,
                    value: `Get DMs about your /donatejeff submissions!`,
                }
            );
    let user = await getUserAndUpdate(tbl, user_id, user_name, false);

    const reply = await interaction.reply({ embeds: [buildEmbed()], components: [settingsRow, utilSettingsRow], flags: MessageFlags.Ephemeral });
    const collectorFilter = i => i.user.id === interaction.user.id; // check the person who pressed the button is the person who started the interaction
    const collector = reply.createMessageComponentCollector({
        filter: collectorFilter,
        time: 120_000, // 2 minutes
    });
    collector.on('collect', async i => {
        if (i.customId === 'deleteInfo') {
            await deleteInfo(user, i, collector, collectorFilter);
            return;
        }
        if (i.customId === 'requestInfo') {
            await requestInfo(user, i, interaction, collector, collectorFilter);
            return;
        }
        user.settings[i.customId] = !user.settings[i.customId];
        user.changed('settings', true);
        await user.save();
        await i.update({
            embeds: [buildEmbed()],
            components: [settingsRow, utilSettingsRow],
            flags: MessageFlags.Ephemeral,
        });
    });
    collector.on('end', async () => {
        await interaction.editReply({
            content: 'This interaction timed out or was cancelled. If you were managing or attempted to manage your user data (like deleting or requesting it), this is expected.',
            components: [],
            embeds: [],
            flags: MessageFlags.Ephemeral,
        });
    })
}

async function requestInfo(user, i, interaction, collector, collectorFilter) {
    await i.update({
        content: `Would you like to request all user information tied to your Discord account that Jeff Bot has stored?\nNote that confirmation of this request, as well as this information will be DMed to you. Please keep your DMs open for Jeff Bot :)`,
        embeds: [],
        components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('yes')
                .setLabel('Yes')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('no')
                .setLabel('No')
                .setStyle(ButtonStyle.Secondary))],
        flags: MessageFlags.Ephemeral
    });
    try {
        const response = await i.message.awaitMessageComponent({ filter: collectorFilter, time: 30000 }); // give 30 sec for response
        if (response.customId === 'yes') {
            const jwmo = await interaction.client.users.fetch(ownerId);
            const user_id = user.userid;
            jwmo.send(`${user.username} REQUEST FOR INFO\n ${user_id}, has requested their information.`)
            const requestor = await interaction.client.users.fetch(user_id);
            requestor.send(`Your request for user information has been submitted. Please allow up to 3 days to receive your information, and remember to check your DMs. If you need any assistance, please contact the developer through GitHub (link at /about). Jeffy loves you and wishes you a great day!`);
        }
        else {
            response.update({ content: `Account information request cancelled by user.`, components: [], flags: MessageFlags.Ephemeral });
        }
        collector.stop('done');
    }
    catch {
        return i.editReply({ content: 'This interaction has timed out.', components: [], flags: MessageFlags.Ephemeral });
    }
}

async function deleteInfo(user, i, collector, collectorFilter) {
    await i.update({
        content: `Are you sure you want to permanently delete all data Jeff Bot has associated with your account? This includes reputation, settings, and all other stored information.\nThis action CANNOT be undone.`,
        embeds: [],
        components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('no')
                .setLabel('No')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('yes')
                .setLabel('Yes')
                .setStyle(ButtonStyle.Danger))],
        flags: MessageFlags.Ephemeral
    });
    try {
        const response = await i.message.awaitMessageComponent({ filter: collectorFilter, time: 30000 }); // give 30 sec for response
        if (response.customId === 'yes') {
            await user.destroy();
            response.update({ content: `All user information associated with your account has been deleted.`, components: [], flags: MessageFlags.Ephemeral });
        }
        else {
            response.update({ content: `Account deletion cancelled by user.`, components: [], flags: MessageFlags.Ephemeral });
        }
        collector.stop('done');
    }
    catch {
        return i.editReply({ content: 'This interaction has timed out.', components: [], flags: MessageFlags.Ephemeral });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Look at and change your user-specific settings'),
    async execute(interaction) {
        const name = interaction.member?.displayName || interaction.user.username;
        await settingsFunction(interaction.client.db.jeff, interaction, interaction.user.id, name);
    },
};