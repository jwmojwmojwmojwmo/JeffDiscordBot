import { SlashCommandBuilder, MessageFlags, escapeMarkdown } from 'discord.js';
import { getUserAndUpdate } from '../../helpers/utils.js';

const energytoBubble = 25;

export const cooldown = 7;
export const data = new SlashCommandBuilder()
    .setName('bubble')
    .setDescription(`Bubble someone with Jeff and make them gain reputation! (${energytoBubble} energy cost)`)
    .addUserOption(option => option
        .setName('user')
        .setDescription('Who you want to Jeff to bubble?')
        .setRequired(true));
export async function execute(interaction) {
    if (!interaction.guild) {
        return interaction.reply({ content: 'This command can\'t be used in DMs.', flags: MessageFlags.Ephemeral });
    }
    if (interaction.options.getUser('user').id === interaction.user.id) {
        return interaction.reply({ content: 'You can\'t bubble yourself!', flags: MessageFlags.Ephemeral });
    }
    const db = interaction.client.db.jeff;
    const victim_name = interaction.options.getMember('user').displayName;
    const culprit_name = interaction.member.displayName;
    const victim = await getUserAndUpdate(db, interaction.options.getUser('user').id, victim_name, false);
    const culprit = await getUserAndUpdate(db, interaction.user.id, culprit_name, false);
    // bubbling logic
    if (culprit.energy < energytoBubble) {
        await victim.save();
        await culprit.save();
        await interaction.reply({ content: `You need ${energytoBubble - culprit.energy} more energy to run this command!`, flags: MessageFlags.Ephemeral });
    } else {
        culprit.energy -= energytoBubble;
        victim.reputation += 1;
        await victim.save();
        await culprit.save();
        console.log(`${victim.username} (${victim.userid}) was bubbled by ${culprit.username} (${culprit.userid})`);
        await interaction.reply(escapeMarkdown(`${culprit_name} bubbled ${victim_name}! ${culprit_name} has used ${energytoBubble} energy, and ${victim_name} has gained 1 reputation!`));
    }
}