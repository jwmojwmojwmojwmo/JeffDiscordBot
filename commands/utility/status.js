const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

const offlineinhours = 24; // change this value for time until bot goes offline (in hours from time when commands deployed)
const onlineinhours = 12; // change this value for time until bot comes back online (in hours after bot goes offline)

const Status = Object.freeze({
    ONLINE: 'Online - No known issues',
    ONLINEUPDATE: 'Online - Occasional outages expected due to updating the bot - Some actions may not be saved if done during an outage',
    ONLINEISSUE: 'Online - outages expected due to known issue(s) - Some actions may not be saved if done during an outage',
    ONLINEUNKNOWN: 'Online - outages expected due to unknown reasons - Some actions may not be saved if done during an outage',
    ONLINESLOW: 'Online - expect slower response times',
    ONLINEPANIC: 'Online - Stability uncertain (bot may go down anytime) mrr... :('
});

const now = Math.floor(Date.now() / 1000);
const timea = now + (offlineinhours * 60 * 60); // in form now + ('time in hours' * 60 * 60)
const timeb = timea + (onlineinhours * 60 * 60);
const statusEmbed = new EmbedBuilder()
    .setTitle('Jeff Discord Bot Status')
    .setThumbnail('https://i.imgur.com/ntg31Zx.jpeg')
    .addFields(
        { name: `Status: ${Status.ONLINE}`, value: `\nPlanned to go offline <t:${timea}:R>, planned to come back online <t:${timeb}:R> (times are approximate)` },
        { name: `Known issues:`, value: `Newly added commands may not show up in Discord client immediately. Close and reopen Discord to force update, or wait up to an hour for Discord to propogate the update automatically.` },
        { name: 'Latest update: v0.83', value: 'Changes:\nAdded /gift: you can now gift energy to others! Beware though, Jeff is collecting tax...\nAdded /vote because I need to fuel my ego by seeing a higher vote number on Top.gg. (Also in preparation for more energy generation and spending methods).\nAdded /donatesuggestions because I\'m out of ideas, please leave any suggestions you have thank you thank you thank you.' },
        { name: 'Next major update sneak peek: v0.9', value: 'Gambling...I love gambling... hehehe' },
        { name: '\u200B', value: `Updated at <t:${now}:T>` },
    );

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Get status of bot and most recent update notes'),
    async execute(interaction) {
        console.log(`Status was checked.`);
        await interaction.reply({ embeds: [statusEmbed] });
    },
};