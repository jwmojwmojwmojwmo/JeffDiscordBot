const { SlashCommandBuilder, bold, MessageFlags } = require('discord.js');
const statLabels = {
    num_nommed: 'Nom Count',
    energy: 'Energy',
    reputation: 'Reputation',
};

async function getTopFive(tbl, guild, stat_type) {
    const entries = await tbl.findAll({
        attributes: ['userid', 'username', stat_type],
        raw: true, // map database to JSON
    });
    entries.sort((a, b) => b[stat_type] - a[stat_type]); // sort JSON by stat_type, high to low
    let topFive = [];
    let leaderboard = `Top ${guild === 0 ? 'Global' : 'Server'} Users — ${statLabels[stat_type] || 'unnamed_stat_type -- please report this error --'}:\n`;
    if (guild === 0) { // global scope
        topFive = entries.slice(0, 5);
    }
    else { // server scope
        // guild.members.cache.forEach(member => {
        //     console.log(member.user.username, member.id);
        // });
        for (const entry of entries) {
            if (topFive.length === 5) break;
            let member;
            member = guild.members.cache.get(entry.userid); // check if each member in entries is in guild, checking cache first for speed
            if (member) {
                topFive.push(entry);
                continue;
            }
            try {
                member = await guild.members.fetch(entry.userid); // check if each member in entries is in guild
                if (member) {
                    topFive.push(entry);
                }
            }
            catch { } // pass
        }
    }
    let rank = 1;
    for (const user of topFive) {
        if (stat_type === 'num_nommed') {
            leaderboard += `\n#${bold(rank)} ${user.username}: ${user[stat_type]} time${user[stat_type] === 1 ? '' : 's'} nommed!`;
        }
        else {
            leaderboard += `\n#${bold(rank)} ${user.username}: ${user[stat_type]} ${stat_type}!`;
        }
        rank++;
    }
    return leaderboard;
}

// TODO: add autofill/default values
module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Gets leaderboard of a statistic')
        .addStringOption(option =>
            option.setName('stat_type')
                .setDescription('Type of stat for leaderboard')
                .setRequired(true)
                .addChoices(
                    { name: 'nom_count', value: 'num_nommed' },
                    { name: 'energy', value: 'energy' },
                    { name: 'reputation', value: 'reputation' },
                ))
        .addStringOption(option =>
            option.setName('scope')
                .setDescription('Choose global or server leaderboard')
                .setRequired(true)
                .addChoices(
                    { name: 'Global', value: 'global' },
                    { name: 'Server', value: 'server' },
                )),
    async execute(interaction) {
        const scope = interaction.options.getString('scope');
        const stat = interaction.options.getString('stat_type');
        if (!interaction.guild && scope === 'server') {
            return interaction.reply({ content: 'This command can\'t be used in DMs.', flags: MessageFlags.Ephemeral });
        }
        const tbl = interaction.client.db.jeff;
        await interaction.reply('Fetching...');
        let reply;
        if (scope === 'global') {
            reply = await getTopFive(tbl, 0, stat);
        }
        else {
            reply = await getTopFive(tbl, interaction.guild, stat);
        }
        await interaction.editReply(reply);
    },
};