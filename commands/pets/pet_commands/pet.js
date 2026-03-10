import { SlashCommandSubcommandBuilder, MessageFlags, escapeMarkdown, heading, ContainerBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputStyle, LabelBuilder, TextInputBuilder, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { getPetLevel, getUserAndUpdate, removeAmountFromInventory, updatePetStats } from '../../../helpers/utils.js';

import path from 'path';
import { fileURLToPath } from 'url';
import _ from 'lodash';
import GIFEncoder from 'gif-encoder-2'; 
import Canvas from 'canvas';

const __filename = fileURLToPath(import.meta.url);

const FRAMES = 10;
const petGifCache = [];

const defaultOptions = {
    resolution: 128,
    delay: 20,
    backgroundColor: null,
};

// thank you very much to the npm package pet-pet-gif, i may or may not have stolen all the code from it
// i would've used the package but i couldn't install it cuz wrong version of gifencoder
async function generatePetPet(avatarURL, options = {}) {
    options = _.defaults(options, defaultOptions);
    const encoder = new GIFEncoder(options.resolution, options.resolution);
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(options.delay);
    encoder.setTransparent();
    const canvas = Canvas.createCanvas(options.resolution, options.resolution);
    const ctx = canvas.getContext('2d');
    const avatar = await Canvas.loadImage(avatarURL);
    for (let i = 0; i < FRAMES; i++) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (options.backgroundColor) {
            ctx.fillStyle = options.backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        const j = i < FRAMES / 2 ? i : FRAMES - i;
        const width = 0.8 + j * 0.02;
        const height = 0.8 - j * 0.05;
        const offsetX = (1 - width) * 0.5 + 0.1;
        const offsetY = (1 - height) - 0.08;
        // Load the hand frame if it isn't cached yet
        if (i === petGifCache.length) {
            petGifCache.push(await Canvas.loadImage(path.resolve(process.cwd(), `assets/pet/pet${i}.gif`)));
        }
        ctx.drawImage(avatar, options.resolution * offsetX, options.resolution * offsetY, options.resolution * width, options.resolution * height);
        ctx.drawImage(petGifCache[i], 0, 0, options.resolution, options.resolution);
        encoder.addFrame(ctx);
    }
    encoder.finish();
    return encoder.out.getData();
}


export const data = new SlashCommandSubcommandBuilder()
    .setName('pet')
    .setDescription('Play with your pet by petting them!');
export async function execute(interaction) {
    const pet = await interaction.client.db.pets.findByPk(interaction.user.id);
    if (!pet) return interaction.reply({ content: `You don't have a pet yet! But rumor has it if you fish up something unknown and use it, you might just find a feisty companion.`, flags: MessageFlags.Ephemeral });
    await interaction.deferReply();
    const xp = 1;
    let affection = 5;
    // cap at 100
    affection = Math.min(100 - pet.affection, affection);
    const level = getPetLevel(pet.xp);
    await updatePetStats(pet, level); 
    pet.xp += xp;
    pet.affection += affection;
    const currentTime = Date.now();
    pet.last_played = currentTime;
    await pet.save();
    const gifBuffer = await generatePetPet(`./assets/${pet.picture}`);
    const file = new AttachmentBuilder(gifBuffer, { name: 'pet.gif' });
    await interaction.editReply({content: `You pet ${escapeMarkdown(pet.name)}! Aren't they so adorable? (+${affection} affection) (+${xp} xp)`, files: [file]});
    console.log(`${interaction.user.displayName} (${interaction.user.id}) pet their pet.`);
}   
