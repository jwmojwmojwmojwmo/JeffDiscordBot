import { SlashCommandBuilder, escapeMarkdown } from 'discord.js';
import { getUserAndUpdate } from '../../helpers/utils.js';

async function getStat(tbl, user_id, user_name, stat_type) {
    let user = await getUserAndUpdate(tbl, user_id, user_name, true);
    if (stat_type !== 'all_stats') {
        return user[stat_type];
    }
    return {
        nom_count: user.num_nommed,
        energy: user.energy,
        reputation: user.reputation,
    };
}

// TODO: add autofill/default values
export const data = new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Provides information of a user\'s stats.')
    .addUserOption(option => option
        .setName('user')
        .setDescription('User that you want to see stats of'))
    .addStringOption(option => option.setName('stat_type')
        .setDescription('Type of stat you want to see')
        .addChoices(
            { name: 'all_stats', value: 'all_stats' },
            { name: 'nom_count', value: 'num_nommed' },
            { name: 'energy', value: 'energy' },
            { name: 'reputation', value: 'reputation' }
        ));
export async function execute(interaction) {
    const tbl = interaction.client.db.jeff;
    let msg = interaction.options.getMember('user')?.displayName || interaction.options.getUser('user')?.username || interaction.member?.displayName || interaction.user.username;
    const statType = interaction.options.getString('stat_type') || 'all_stats';
    const stat = await getStat(tbl, interaction.options.getUser('user')?.id || interaction.user.id, msg, statType);
    msg = escapeMarkdown(msg);
    if (statType === 'num_nommed') {
        msg += ` has been nommed ${stat} time${stat === 1 ? '' : 's'}!`; // 1 time vs multiple times in message
    }
    else if (statType === 'all_stats') {
        msg += `'s stats!\n\nTimes nommed: ${stat.nom_count}\nEnergy: ${stat.energy}\nReputation: ${stat.reputation}`;
    }
    else {
        msg += ` has ${stat} ${statType}!`;
    }
    await interaction.reply(msg);
}