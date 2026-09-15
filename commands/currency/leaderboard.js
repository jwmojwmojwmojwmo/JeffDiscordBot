import { SlashCommandBuilder, bold, MessageFlags, escapeMarkdown } from 'discord.js';
import { renderUsername, verifyUserTitle } from '../../helpers/utils.js';
import { Op } from 'sequelize';
const statLabels = {
    num_nommed: 'Nom Count',
    energy: 'Energy',
    reputation: 'Reputation',
};

async function getTopFive(db, guild, stat_type, itemCache) {
    let topFive = [];

    if (guild === 0) {
        topFive = await db.jeff.findAll({
            order: [[stat_type, 'DESC']],
            limit: 5
            // Removed raw: true so verifyUserTitle can still use user.save()
        });
    } else {
        const topGlobal = await db.jeff.findAll({
            order: [[stat_type, 'DESC']],
            limit: 200
        });

        for (const user of topGlobal) {
            if (topFive.length === 5) break;

            try {
                const member = await guild.members.fetch(user.userid);
                if (member) {
                    topFive.push(user);
                }
            } catch (err) {
                // pass
            }
        }
    }

    let leaderboard = `Top ${guild === 0 ? 'Global' : 'Server'} Users — ${statLabels[stat_type] || 'unnamed_stat_type -- please report this error --'}:\n`;
    let rank = 1;

    for (const user of topFive) {
        // Pass the full 'db' object so verifyUserTitle can check inventories
        await verifyUserTitle(db, user, itemCache);

        const user_name = renderUsername(user, user.username);

        if (stat_type === 'num_nommed') {
            leaderboard += `\n#${bold(rank)} ${user_name}: ${user[stat_type]} time${user[stat_type] === 1 ? '' : 's'} nommed!`;
        } else {
            leaderboard += `\n#${bold(rank)} ${user_name}: ${user[stat_type]} ${stat_type}!`;
        }
        rank++;
    }

    if (topFive.length === 0) {
        leaderboard += "\nNo users found!";
    }

    if (topFive.length < 5 && guild !== 0) {
        leaderboard += "\n\nIf some entries are missing, this is a known issue and should be fixed in the next update.";
    }

    return leaderboard;
}

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Gets leaderboard of a statistic')
    .addStringOption(option => option.setName('stat_type')
        .setDescription('Type of stat for leaderboard')
        .setRequired(true)
        .addChoices(
            { name: 'nom_count', value: 'num_nommed' },
            { name: 'energy', value: 'energy' },
            { name: 'reputation', value: 'reputation' }
        ))
    .addStringOption(option => option.setName('scope')
        .setDescription('Choose global or server leaderboard')
        .addChoices(
            { name: 'Global', value: 'global' },
            { name: 'Server', value: 'server' }
        ));
export async function execute(interaction) {
    const scope = interaction.options.getString('scope') || 'global';
    const stat = interaction.options.getString('stat_type');
    if (!interaction.guild && scope === 'server') {
        return interaction.reply({ content: 'This command can\'t be used in DMs.', flags: MessageFlags.Ephemeral });
    }
    const db = interaction.client.db;
    await interaction.reply('Fetching...');
    let reply;
    if (scope === 'global') {
        reply = await getTopFive(db, 0, stat, interaction.client.itemCache);
    }
    else {
        reply = await getTopFive(db, interaction.guild, stat, interaction.client.itemCache);
    }
    await interaction.editReply(reply);
}