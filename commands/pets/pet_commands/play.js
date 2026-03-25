import { SlashCommandSubcommandBuilder, EmbedBuilder } from 'discord.js';
import { updatePetStats, getPetLevel } from '../../../helpers/utils.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('play')
    .setDescription('Play with your pet!')
export async function execute(interaction, pet) {
    const playEmbed = new EmbedBuilder()
        .setTitle(`Playing with ${pet.name}`)
        .setDescription(
            `${pet.name} is a social shark! You can bond with your pet by doing certain commands with them.`
        )
        .addFields(
            { name: '`/pet pet`', value: 'Pet your pet for some low effort affection and xp! (Gains XP + Affection)', inline: true },
            { name: '`/fish`', value: 'Go fishing! Your pet might be able to help catch some stuff... (Requires Hunger, Gains XP)', inline: true },
            { name: '`/play`', value: 'Play games to build a bond. (Requires XP, Gains Affection)', inline: true },
            { name: '`/nom`', value: 'Go eat some people and feed your pet! (Gains Hunger + Affection)', inline: true },
            { name: '`/bubble`', value: 'Go bubble some people with your pet! (Requires Hunger, Gains XP + Affection)', inline: true },
            { name: '`/spit`', value: 'Go spit on some people with your pet! (Requires Hunger, Gains XP + Affection)', inline: true },
        )
        .setColor(0x80aaff);

    await interaction.reply({ embeds: [playEmbed] });
    const xpLoss = await updatePetStats(pet, getPetLevel(pet.xp));
    if (xpLoss > 0) await interaction.followUp({ content: `Oh no! While you were away, your pet's hunger and affection dropped to 0 for too long, losing ${xpLoss} XP. Spend some time with your buddy!`, flags: MessageFlags.Ephemeral });
}   
