import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import * as viewCommand from "./pet_commands/view.js";

const subcommands = Object.freeze({
    "view": viewCommand
})

export const data = new SlashCommandBuilder()
    .setName('pet')
    .setDescription('Interact with your pet!')
    .addSubcommand(viewCommand.data);
export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    await subcommands[subcommand].execute(interaction);
}