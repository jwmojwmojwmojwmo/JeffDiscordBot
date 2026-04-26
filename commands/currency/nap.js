import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { getUserAndUpdate, getNapEnergy } from '../../helpers/utils.js';

export const data = new SlashCommandBuilder()
    .setName('nap')
    .setDescription('Put Jeff to sleep! Passively gain energy while sleeping. He wakes up once you run another command.')
export async function execute(interaction) {
    const wakeCommandsString = interaction.client.wakeCommands.map((c) => `/${c}`).join(", ");
    const now = Date.now();
    if (interaction.client.napping.has(interaction.user.id)) {
        const time = Math.round(interaction.client.napping.get(interaction.user.id) / 1000);
        const napEnergy = getNapEnergy(interaction.client.napping.get(interaction.user.id));
        return interaction.reply({
            content: `Jeff is fast asleep! You put him to bed <t:${time}:R>. Using any of the following commands will wake him up: ${wakeCommandsString}. Currently, waking him up will award you ${napEnergy} energy.`,
            flags: MessageFlags.Ephemeral
        });
    } else {
        const user = await getUserAndUpdate(interaction.client.db.jeff, interaction.user.id, interaction.member?.displayName || interaction.user.displayName, false);
        user.napping = now;
        await user.save();
        interaction.client.napping.set(interaction.user.id, now);
        console.log(`${interaction.user.username} (${interaction.user.id}) put Jeff to sleep.`)
        return interaction.reply({
            content: `You tucked Jeff in for a nap! Using any of the following commands will wake him up: ${wakeCommandsString}. When he wakes up, you'll get some energy based on how long he slept for.`,
            flags: MessageFlags.Ephemeral
        });
        
    }
}