const { AttachmentBuilder, MediaGalleryBuilder, MessageFlags, SlashCommandBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('node:path');
const assetsDir = path.join(__dirname, '..', '..', 'assets');

let file = new AttachmentBuilder('assets/jeff.webp'); // placeholder

let gallery = new MediaGalleryBuilder()
    .addItems(mediaGalleryItem => mediaGalleryItem.setURL('attachment://jeff.webp')); // placeholder

getFile(); // randomise before first call

async function getFile() {
    let fileName = '';
    const files = await fs.readdir(assetsDir);
    if (files.length === 0) { // shouldn't happen
        console.log('No files in assets folder.');
        return;
    }
    do {
        fileName = files[Math.floor(Math.random() * files.length)]; // grabs random filename from assets
    } while (!fileName.includes('jeff'));
    file = new AttachmentBuilder('assets/' + fileName); // creates file from filename
    gallery = new MediaGalleryBuilder().addItems(mediaGalleryItem => mediaGalleryItem.setURL('attachment://' + fileName)); // creates discord media gallery from filename
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jeff')
        .setDescription('Gives Jeff!'),
    async execute(interaction) {
        await getFile();
        console.log("Jeff pictures were requested.");
        await interaction.reply({
            // sends discord media gallery with created file
            components: [gallery],
            files: [file],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
