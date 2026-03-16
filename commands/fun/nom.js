import { SlashCommandBuilder, MessageFlags, escapeMarkdown } from 'discord.js';
import { getPetLevel, updatePetStats } from '../../helpers/utils.js';
const killMsg = [
	' got gobbled by Jeff. Chomp chomp! NOM NOM!',
	' was just swallowed by Jeff whole. Slurp slurp!',
	' is now Jeff’s snack. *nomnomnom*',
	' was caught by Jeff in his jaws. Crunch crunch!',
	' vanished... and Jeff’s tummy says thanks! NOMNOM!',
	' got Jeff’ed. Nomfest initiated!',
    ' was devoured by a very hungry Jeff. *burp*',
    ' became Jeff’s midnight snack. Munch munch!',
    ' is currently digesting in Jeff’s belly. Gurgle gurgle!',
    ' made a delicious meal for Jeff. *lip smack*',
];

export const cooldown = 7;
export const data = new SlashCommandBuilder()
    .setName('nom')
    .setDescription('Nom somebody with Jeff')
    .addUserOption(option => option
        .setName('user')
        .setDescription('Who you want to nom?')
        .setRequired(true));
export async function execute(interaction) {
    if (!interaction.guild) {
        return interaction.reply({ content: 'This command can\'t be used in DMs.', flags: MessageFlags.Ephemeral });
    }
    const victim_id = interaction.options.getUser('user').id;
    const victim_name = interaction.options.getMember('user').displayName;
    if (victim_id === interaction.user.id) {
        return interaction.reply({ content: 'You can\'t nom yourself!', flags: MessageFlags.Ephemeral });
    }
    const victim = await getUserAndUpdate(interaction.client.db.jeff, victim_id, victim_name, false);
    victim.num_nommed += 1;
    await victim.save();
    console.log(`${victim.username} (${victim.userid}) was nommed.`);
    await interaction.reply(escapeMarkdown(victim_name + killMsg[Math.floor(Math.random() * killMsg.length)])); // random kill msg
    const pet = await interaction.client.db.pets.findByPk(interaction.user.id);
    let nom_pet = 0;
    if (pet) {
        const level = getPetLevel(pet.xp);
        await updatePetStats(pet, level);
        nom_pet += level - 1;
        if (level === 10) nom_pet += 1;
        let hunger = 5;
        hunger = Math.min(100 - pet.hunger, hunger);
        pet.hunger += hunger;
        let affection = 5;
        affection = Math.min(100 - pet.affection, affection);
        pet.affection += affection;
        await pet.save();
        victim.num_nommed += nom_pet;
        await victim.save();
        if (nom_pet > 0) await interaction.followUp(escapeMarkdown(`Jeff called over someone's pet, ${pet.name}, who was also hungry! They nommed ${victim_name} an additional ${nom_pet} ${nom_pet > 1 ? 'times' : 'time'}! (${pet.name} got +${hunger} hunger, +${affection} affection)`));
    }
}