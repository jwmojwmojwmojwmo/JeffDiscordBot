const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { ownerId } = require('../../betaconfig.json');
const fs = require('fs');
const path = require('path');
const { getUserAndUpdate } = require('../../utils.js');
const donationPath = path.join(__dirname, '..', '..', 'donations.txt');

// TODO: use template literals
async function addDonation(user, picture) {
    const date = new Date();
    fs.appendFile(donationPath, '\n\n' + JSON.stringify({ url: picture.url }, null, 1) + ', ' + user.username + ', ' + user.userid
        + ', ' + user.settings.donateJeffDM + ', ' + date.toLocaleString(), (err) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log('File written successfully! ' + date.toLocaleString());
        });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('donatejeff')
        .setDescription('Donate a Jeff picture to the bot that can show up when /jeff is used')
        .addAttachmentOption(option =>
            option
                .setName('picture')
                .setDescription('Picture of Jeff to donate')
                .setRequired(true)),
    async execute(interaction) {
        const jwmo = await interaction.client.users.fetch(ownerId);
        const user = await getUserAndUpdate(interaction.client.db.jeff, interaction.user.id, interaction.user.username, false);
        await addDonation(user, interaction.options.getAttachment('picture'));
        await jwmo.send('A Jeff was donated');
        await interaction.reply({ content: 'Thank you for your donation! It will be reviewed and approved if deemed appropriate!', flags: MessageFlags.Ephemeral });
    },
};