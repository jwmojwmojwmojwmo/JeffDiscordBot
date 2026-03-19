import { SlashCommandSubcommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { getUserAndUpdate } from '../../../helpers/utils.js';

const yesButton = new ButtonBuilder()
    .setCustomId('yes')
    .setLabel('Yes')
    .setStyle(ButtonStyle.Danger);
const noButton = new ButtonBuilder()
    .setCustomId('no')
    .setLabel('No')
    .setStyle(ButtonStyle.Primary);
const askRow = new ActionRowBuilder().addComponents(noButton, yesButton);

export const data = new SlashCommandSubcommandBuilder()
    .setName('disown')
    .setDescription('Disown your pet');
export async function execute(interaction, pet) {
    const msg = await interaction.reply({
        content: `Are you sure you want to disown ${pet.name}? They will be gone forever, and you will have to find a new pet. This action cannot be undone.`,
        components: [askRow],
        withResponse: true
    });
    const collectorFilter = i => i.user.id === interaction.user.id;
    try {
        const response = await msg.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 30000 });
        if ((response.customId === 'yes')) {
            const user = await getUserAndUpdate(interaction.client.db.jeff, interaction.user.id, interaction.member?.displayName || interaction.user.displayName, true);
            await pet.destroy();
            user.reputation -= 15;
            await user.save();
            await response.update({ content: `You release your pet into the wild.\n${pet.name} looks back not with anger, but with profound disappointment. You've broken a landshark's heart. (-15 reputation)`, components: [] });
        } else {
            let affection = pet.affection;
            pet.affection = Math.max(0, pet.affection - 50);
            affection -= pet.affection;
            await pet.save();
            await response.update({ content: `You decided not to disown your pet. ${pet.name} is heartbroken you even considered it. (-${affection} affection)`, components: [] });
        }
    } catch (error) {
        await interaction.editReply({ content: "This interaction timed out.", components: [] });
    }
}   
