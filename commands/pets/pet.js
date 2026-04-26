import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import * as viewCommand from "./pet_commands/view.js";
import * as feedCommand from "./pet_commands/feed.js";
import * as petCommand from "./pet_commands/pet.js";
import * as playCommand from "./pet_commands/play.js";
import * as disownCommand from "./pet_commands/disown.js";

const subcommands = Object.freeze({
    "view": viewCommand,
    "feed": feedCommand,
    "pet": petCommand,
    "play": playCommand,
    "disown": disownCommand
})
// TODO:!!!!
// play highlow -> jeff nudges you in right direction (maybe gives a nother number and tells you where it is relative to that one)
// play blackjack -> peek at dealers card
// for both: button to do so, costs xp
export const data = new SlashCommandBuilder()
    .setName('pet')
    .setDescription('Interact with your pet!')
    .addSubcommand(viewCommand.data)
    .addSubcommand(feedCommand.data)
    .addSubcommand(petCommand.data)
    .addSubcommand(playCommand.data)
    .addSubcommand(disownCommand.data);
export async function autocomplete(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommands[subcommand].autocomplete) {
        await subcommands[subcommand].autocomplete(interaction);
    }
}
export async function execute(interaction) {
    const pet = await interaction.client.db.pets.findByPk(interaction.user.id);
    if (!pet) return interaction.reply({ content: `You don't have a pet yet! But rumor has it if you fish up something unknown and use it, you might just find a feisty companion.`, flags: MessageFlags.Ephemeral });
    const subcommand = interaction.options.getSubcommand();
    await subcommands[subcommand].execute(interaction, pet);
}