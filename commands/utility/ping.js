import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping the bot');
export async function execute(interaction) {
    const sent = await interaction.reply({ content: 'Pinging...', withResponse: true, flags: MessageFlags.Ephemeral });
    interaction.editReply(`Roundtrip latency: ${sent.resource.message.createdTimestamp - interaction.createdTimestamp}ms`);
    console.log(`Jeff was pinged.`);
}