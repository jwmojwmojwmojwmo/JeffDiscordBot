import { SlashCommandBuilder, escapeMarkdown, ContainerBuilder, MessageFlags, heading } from 'discord.js';
import { getUserAndUpdate } from '../../helpers/utils.js';

// TODO: add autofill/default values
export const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Take a look at your profile or someone else\'s.')
    .addUserOption(option => option
        .setName('user')
        .setDescription('User that you want to see stats of'));
export async function execute(interaction) {
    const tbl = interaction.client.db;
    const pfp = interaction.options.getUser('user')?.displayAvatarURL() || interaction.user.displayAvatarURL() || interaction.member?.displayAvatarURL() || interaction.user.displayAvatarURL();
    let user_name = interaction.options.getMember('user')?.displayName || interaction.options.getUser('user')?.username || interaction.member?.displayName || interaction.user.displayName;
    const user = await getUserAndUpdate(tbl, interaction.options.getUser('user')?.id || interaction.user.id, user_name, true, true);
    user_name = escapeMarkdown(user_name);
    const container = new ContainerBuilder()
        .setAccentColor(0x80aaff)
        .addSectionComponents((section) => section
            .setThumbnailAccessory((thumbnail) => thumbnail.setURL(pfp))
            .addTextDisplayComponents((text) => text.setContent(
                `${heading(`${user_name}'s Profile`, 2)}\nTimes nommed: ${user.num_nommed}\nEnergy: ${user.energy}\nReputation: ${user.reputation}`)))
        .addSeparatorComponents((separator) => separator);
    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
}