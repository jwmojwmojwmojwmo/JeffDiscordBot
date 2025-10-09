const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');

// constants for link buttons
const dailyRemindersButton = new ButtonBuilder()
    .setCustomId('dailyReminders')
    .setLabel('Toggle Daily Reminders')
    .setStyle(ButtonStyle.Secondary);
const voteReminders = new ButtonBuilder()
    .setCustomId('voteReminders')
    .setLabel('Toggle Vote Reminders')
    .setStyle(ButtonStyle.Secondary);
const DonateJeffDMButton = new ButtonBuilder()
    .setCustomId('donateJeffDM')
    .setLabel('Toggle Donate Jeff DMs')
    .setStyle(ButtonStyle.Secondary);
const settingsRow = new ActionRowBuilder().addComponents(dailyRemindersButton, voteReminders, DonateJeffDMButton); // the row of buttons below the text

async function settingsFunction(interaction, user_name, user_id, tbl) {
    const buildEmbed = () =>
        new EmbedBuilder()
            .setTitle(`${user_name}'s Settings`)
            .addFields(
                {
                    name: `Daily Reminders - **${user.settings.dailyReminders}**`,
                    value:  `Get a reminder every day if you forget /daily! (This feature is coming soon)`,
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

    let user = await tbl.findByPk(user_id);
    if (!user) {
        user = await tbl.create({
            userid: user_id,
            username: user_name,
        });
        console.log('New user created:', user.toJSON());
    }

    const reply = await interaction.reply({ embeds: [buildEmbed()], components: [settingsRow], flags: MessageFlags.Ephemeral });
    const collectorFilter = i => i.user.id === interaction.user.id; // check the person who pressed the button is the person who started the interaction
    const collector = reply.createMessageComponentCollector({
        filter: collectorFilter,
        time: 120_000, // 2 minutes
    });
    collector.on('collect', async i => {
        user.settings[i.customId] = !user.settings[i.customId];
        user.changed('settings', true);
        await user.save();
        await i.update({
            embeds: [buildEmbed()],
            components: [settingsRow],
            flags: MessageFlags.Ephemeral,
        });
    });
    collector.on('end', async () => {
        await interaction.editReply({
            content: 'This interaction timed out.',
            components: [],
            embeds: [buildEmbed()],
            flags: MessageFlags.Ephemeral,
        });
    })
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Look at and change your user-specific settings'),
    async execute(interaction) {
        let name;
        try {
            name = interaction.member.displayName;
        }
        catch (err) {
            name = interaction.user.username;
        }
        await settingsFunction(interaction, name, interaction.user.id, interaction.client.db.jeff);
    },
};