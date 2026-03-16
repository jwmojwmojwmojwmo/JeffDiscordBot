import { SlashCommandBuilder, MessageFlags, escapeMarkdown } from 'discord.js';
import { getUserAndUpdate, getPetLevel, updatePetStats } from '../../helpers/utils.js';

const energyToSpit = 25;

export const cooldown = 7;
export const data = new SlashCommandBuilder()
    .setName('spit')
    .setDescription(`Spit on someone with Jeff and make them lose reputation! (${energyToSpit} energy cost)`)
    .addUserOption(option => option
        .setName('user')
        .setDescription('Who you want to Jeff to spit on?')
        .setRequired(true));
export async function execute(interaction) {
    if (!interaction.guild) {
        return interaction.reply({ content: 'This command can\'t be used in DMs.', flags: MessageFlags.Ephemeral });
    }
    if (interaction.options.getUser('user').id === interaction.user.id) {
        return interaction.reply({ content: 'You can\'t spit on yourself!', flags: MessageFlags.Ephemeral });
    }
    const db = interaction.client.db.jeff;
    const victim_name = interaction.options.getMember('user').displayName;
    const culprit_name = interaction.member.displayName;
    const victim = await getUserAndUpdate(db, interaction.options.getUser('user').id, victim_name, false);
    const culprit = await getUserAndUpdate(db, interaction.user.id, culprit_name, false);
    // spitting logic
    if (culprit.energy < energyToSpit) {
        await victim.save();
        await culprit.save();
        await interaction.reply({ content: `You need ${energyToSpit - culprit.energy} more energy to run this command!`, flags: MessageFlags.Ephemeral });
    } else {
        culprit.energy -= energyToSpit;
        victim.reputation -= 1;
        await victim.save();
        await culprit.save();
        const pet = await interaction.client.db.pets.findByPk(interaction.user.id);
        let pet_spit = 0;
        await interaction.reply(escapeMarkdown(`${culprit_name} spit on ${victim_name}! ${culprit_name} has used ${energyToSpit} energy, and ${victim_name} lost 1 reputation!`));
        console.log(`${victim.username} (${victim.userid}) was spit on by ${culprit.username} (${culprit.userid})`);
        if (pet) {
            const level = getPetLevel(pet.xp);
            await updatePetStats(pet, level);
            if (pet.hunger < 10) return interaction.followUp(escapeMarkdown(`${culprit_name}'s pet, ${pet.name}, was too hungry to help spit...(requires 10 hunger)`));
            pet_spit += level - 1;
            if (level === 10) pet_spit += 1;
            pet.hunger -= 10;
            let affection = 10;
            affection = Math.min(100 - pet.affection, affection);
            pet.affection += affection;
            pet.xp += 25;
            await pet.save();
            victim.reputation += pet_spit;
            await victim.save();
            await interaction.followUp(escapeMarkdown(`${culprit_name}'s pet, ${pet.name}, helped supercharge Jeff's spit! They made ${victim_name} lose an additional ${pet_spit} reputation! (${pet.name} got -10 hunger, +${affection} affection, +25 xp)`));
            console.log(`${victim.username}'s pet helped spit an additional ${pet_spit} times.`);
        }

    }
}