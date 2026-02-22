import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, escapeMarkdown } from 'discord.js';
import { getUserAndUpdate } from '../../helpers/utils.js';
import config from '../../helpers/config.json' with { type: "json" };
const { ownerId } = config;

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
    .setLabel('Toggle Jeff DMs')
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
            .setTitle(`${escapeMarkdown(user_name)}'s Settings`)
            .addFields(
                {
                    name: `Daily Reminders - **${user.settings.dailyReminders}**`,
                    value: `Get a reminder every day if you forget /daily!`,
                },
                {
                    name: `Vote Reminders - **${user.settings.voteReminders}**`,
                    value: `Get reminded to vote for more rewards!`,
                },
                {
                    name: `Jeff DMs - **${user.settings.donateJeffDM}**`,
                    value: `Get DMs from Jeff bot about any donation submissions!`,
                }
            );
    let user = await getUserAndUpdate(tbl, user_id, user_name, false);

    const reply = await interaction.reply({ embeds: [buildEmbed()], components: [settingsRow, utilSettingsRow], flags: MessageFlags.Ephemeral });
    const collectorFilter = i => i.user.id === interaction.user.id; // check the person who pressed the button is the person who started the interaction
    const collector = reply.createMessageComponentCollector({
        filter: collectorFilter,
        time: 60_000, // 1 minute
    });
    collector.on('collect', async i => {
        if (i.customId === 'deleteInfo') {
            collector.stop('deleteInfo');
            await deleteInfo(user, i, collectorFilter);
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
    collector.on('end', async (_collected, reason) => {
        if (reason === 'deleteInfo') return;
        await interaction.editReply({
            content: 'This interaction timed out.',
            components: [],
            embeds: [],
            flags: MessageFlags.Ephemeral,
        });
    })
}

// TODO: fix settings bug where names of buttons in requestInfo and deleteInfo are stored into settings JSON
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
    }
    catch {
        return i.editReply({ content: 'This interaction has timed out.', components: [], flags: MessageFlags.Ephemeral });
    }
}

async function deleteInfo(user, i, collectorFilter) {
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
            console.log(`${JSON.stringify(user.toJSON(), null, 2)} deleted their account.`);
            await user.destroy();
            await response.update({ content: `All user information associated with your account has been deleted.`, components: [], flags: MessageFlags.Ephemeral });
        }
        else {
            await response.update({ content: `Account deletion cancelled by user.`, components: [], flags: MessageFlags.Ephemeral });
        }
    }
    catch {
        return i.editReply({ content: 'This interaction has timed out.', components: [], flags: MessageFlags.Ephemeral });
    }
}

export const data = new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Look at and change your user-specific settings');
export async function execute(interaction) {
    const name = interaction.member?.displayName || interaction.user.username;
    await settingsFunction(interaction.client.db.jeff, interaction, interaction.user.id, name);
}