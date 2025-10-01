const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const client = require('../../index.js');
const { ownerId } = require('../../config.json');
const fs = require('fs');
const path = require("path");
const donationPath = path.join(__dirname, "..", "..", 'donations.txt')
const errPath = path.join(__dirname, "..", "..", 'errors.txt')

function reportError(err) {
    let date = new Date();
    fs.appendFileSync(errPath, err.stack + ", " + date.toLocaleString() + "\n\n");
    console.error(err);
}

function addDonation(picture, user, userid) {
    let date = new Date();
    fs.appendFile(donationPath, "\n\n" + JSON.stringify({ url: picture.url }, null, 1) + ", " + user + ", " + userid + ", " + date.toLocaleString(), (err) => {
        if (err) {
            reportError(err);
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
        const jwmo = await client.users.fetch(ownerId);
        addDonation(interaction.options.getAttachment('picture'), interaction.user.username.toString(), interaction.user.id);
        await jwmo.send('A Jeff was donated');
        await interaction.reply({ content: "Thank you for your donation! It will be reviewed and approved if deemed appropriate!", flags: MessageFlags.Ephemeral });
    },
};  