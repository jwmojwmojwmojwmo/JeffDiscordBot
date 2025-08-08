const { AttachmentBuilder, MediaGalleryBuilder, MessageFlags, SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const assetsDir = path.join(__dirname, "..", "..", 'assets');

let file = new AttachmentBuilder('assets/jeff.webp');

let gallery = new MediaGalleryBuilder()
    .addItems(mediaGalleryItem => mediaGalleryItem.setURL('attachment://jeff.webp'));

getFile();

function getFile() {
    let fileName = "";
    fs.readdir(assetsDir, (err, files) => {
        if (err) {
            console.error('Failed to read assets folder:', err);
            return;
        }

        if (files.length === 0) {
            console.log('No files in assets folder.');
            return;
        }

        const randomIndex = Math.floor(Math.random() * files.length);
        fileName = files[randomIndex];
        file = new AttachmentBuilder("assets/" + fileName);
        gallery = new MediaGalleryBuilder().addItems(mediaGalleryItem => mediaGalleryItem.setURL('attachment://' + fileName));
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jeff')
        .setDescription('Gives Jeff!'),
    async execute(interaction) {
        getFile();
        await interaction.reply({
            components: [gallery],
            files: [file],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
