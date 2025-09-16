const { AttachmentBuilder, MediaGalleryBuilder, MessageFlags, SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const assetsDir = path.join(__dirname, "..", "..", 'assets');
const errPath = path.join(__dirname, "..", "..", 'errors.txt')

let file = new AttachmentBuilder('assets/jeff.webp'); // placeholder

let gallery = new MediaGalleryBuilder()
    .addItems(mediaGalleryItem => mediaGalleryItem.setURL('attachment://jeff.webp')); // placeholder

getFile(); // randomise before first call

function reportError(err) {
    let date = new Date();
    fs.appendFileSync(errPath, err.stack + ", " + date.toLocaleString() + "\n\n");
    console.error(err);
}

function getFile() {
    let fileName = "";
    fs.readdir(assetsDir, (err, files) => {
        if (err) {
            reportError(err);
            return;
        }
        if (files.length === 0) { //shouldn't happen
            console.log('No files in assets folder.');
            return;
        }
        fileName = files[Math.floor(Math.random() * files.length)]; // grabs random filename from assets
        file = new AttachmentBuilder("assets/" + fileName); // creates file from filename
        gallery = new MediaGalleryBuilder().addItems(mediaGalleryItem => mediaGalleryItem.setURL('attachment://' + fileName)); // creates discord media gallery from filename
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jeff')
        .setDescription('Gives Jeff!'),
    async execute(interaction) {
        getFile();
        await interaction.reply({
            // sends discord media gallery with created file
            components: [gallery],
            files: [file],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
