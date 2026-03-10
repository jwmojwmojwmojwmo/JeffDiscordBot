import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import * as viewCommand from "./pet_commands/view.js";
import * as feedCommand from "./pet_commands/feed.js";
import * as petCommand from "./pet_commands/pet.js";

const subcommands = Object.freeze({
    "view": viewCommand,
    "feed": feedCommand,
    "pet": petCommand
})

export const data = new SlashCommandBuilder()
    .setName('pet')
    .setDescription('Interact with your pet!')
    .addSubcommand(viewCommand.data)
    .addSubcommand(feedCommand.data)
    .addSubcommand(petCommand.data);
export async function autocomplete(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommands[subcommand].autocomplete) {
        await subcommands[subcommand].autocomplete(interaction);
    }
}
export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    await subcommands[subcommand].execute(interaction);
}