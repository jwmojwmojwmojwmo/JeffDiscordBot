import { SlashCommandBuilder, MessageFlags, escapeMarkdown } from 'discord.js';
import config from '../../helpers/config.json' with { type: "json" };
const { rivalsAPIKey } = config;
import { RivalsAPIError } from '../../helpers/utils.js';
import axios from 'axios';
const { get } = axios;

const rivalsBaseURL = 'https://marvelrivalsapi.com';
const season = 5.5;

const disclaimer = `\n\nNote this command currently uses data from Season ${season}. It will be updated to use data from the current season in a few days, when enough ranked Jeff gameplay data is gathered.`;
//const disclaimer = ``;

const lastUpdate = {}; // playerID: timestamp

function canUpdate(playerId) {
    const now = Date.now();
    const last = lastUpdate[playerId] || 0;
    return now - last >= 30 * 60 * 1000;
}

async function getPlayer(db, interaction, uid) {
    let name = uid;
    const userByUid = await db.findByPk(uid);
    const userByUsername = await db.findOne({
        where: { username: uid },
    });
    if (userByUid) {
        name = userByUid.username;
    }
    if (userByUsername) {
        uid = userByUsername.uid;
    }
    if (canUpdate(uid)) {
        try {
            await get(`${rivalsBaseURL}/api/v1/player/${uid}/update`,
                { headers: { "x-api-key": rivalsAPIKey } }).then(res => {
                    console.log("Player updated request sent!");
                    lastUpdate[uid] = Date.now();
                });
        } catch (err) {
            if (err.response.status === 400 || err.response.status === 404) {
                throw new Error('UNDEFINED_USER');
            } else {
                lastUpdate[uid] = Date.now();
                console.log("Player is on 30-minute lock, according to the API. Try later.");
            }
        }
    } else {
        console.log("Player is on 30-minute lock. Try later.");
    }
    let data;
    await interaction.editReply(`Player: ${name}\n\nFetching player stats...${disclaimer}`);
    try {
        data = await get(`${rivalsBaseURL}/api/v1/player/${uid}`,
            { params: { 'season': season }, headers: { 'x-api-key': rivalsAPIKey } });
    } catch (err) {
        if (err.response.status === 403) {
            throw new Error('PRIVATE_USER');
        } else if (err.response.status === 429) {
            throw new RivalsAPIError('RATE_LIMIT_REACHED', err.response.headers['x-ratelimit-reset'], '');
        } else {
            console.error(err);
            throw new RivalsAPIError('API_ERROR', '', err.response?.data?.message || 'unknown error');
        }
    }
    return data;
}

async function updateRivalsPlayer(db, data) {
    const uid = data.uid;
    const username = data.name;
    let user = await db.findByPk(uid);
    if (user) {
        user.username = username;
        await user.save();
    }
    else {
        user = await db.create({
            uid: uid,
            username: username,
        });
        const date = new Date();
        console.log('New user created:', user.toJSON(), date.toLocaleString());
    }
}

export const data = new SlashCommandBuilder()
    .setName('skillcheck')
    .setDescription('Checks your skill level at Jeff (This command is currently experimental)')
    .addStringOption(option => option
        .setName('player')
        .setDescription('Marvel Rivals in-game name or uid of player to check.')
        .setRequired(true));
export async function execute(interaction) {
    let name = interaction.options.getString('player');
    await interaction.reply({ content: `Player: ${name}\n\nPlease hold while Jeff negotiates with the Marvel Rivals servers...\nThis may take some time...${disclaimer}`, flags: MessageFlags.Ephemeral });
    let data;
    try {
        data = await getPlayer(interaction.client.db.rivalsData, interaction, name);
    } catch (err) {
        if (err instanceof RivalsAPIError) {
            if (err.message === 'RATE_LIMIT_REACHED') {
                return interaction.editReply({ content: `Jeff may be cute but the Marvel Rivals servers are refusing him access because he's being a little too pushy. Please let Jeffy rest and try again <t:${err.time}:R>.`, flags: MessageFlags.Ephemeral });
            }
            console.error(err);
            return interaction.editReply({ content: `Something unexpected happened. Error message: ${escapeMarkdown(err.info)}\nIf this issue persists, please report it.\n\nIt is possible this happened because of a mistyped username. Please note usernames are case-sensitive.` });
        }
        if (err.message === 'UNDEFINED_USER') {
            return interaction.editReply({ content: 'Cannot find user, please check you typed the username correctly. Usernames are case-sensitive. Note that this could be because the user\'s profile is set to private.\nIf you believe everything is correct and this error still shows, try searching by UID.', flags: MessageFlags.Ephemeral });
        }
        if (err.message === 'PRIVATE_USER') {
            return interaction.editReply({ content: 'This user\'s profile is set to private.', flags: MessageFlags.Ephemeral });
        }
    }
    await updateRivalsPlayer(interaction.client.db.rivalsData, data.data);
    const ranked = data.data.heroes_ranked.find(h => h.hero_id === 1047);
    if (ranked == null) {
        return interaction.editReply({ content: 'Cannot calculate skill level without Jeff games played in ranked this season. (Placement matches do not count)', flags: MessageFlags.Ephemeral });
    }
    let matchup = data.data.hero_matchups.find(h => h.hero_id === 1047); // matchup is this hero's winrate against yours, ie the player's winrate against jeff is 100%-matchup; competitive only
    let rankedWinrate = (ranked.wins / ranked.matches) * 100;
    let rankedMVPRate = ranked.wins > 0 ? (ranked.mvp / ranked.wins) * 100 : 0;
    let rankedSVPRate = (ranked.matches - ranked.wins) > 0 ? (ranked.svp / (ranked.matches - ranked.wins)) * 100 : 0;
    let rankedKDA = (ranked.deaths) > 0 ? (ranked.kills + ranked.assists) / (ranked.deaths) : 9999999;
    let rankedPlayTime = ranked.play_time / 3600;
    let rankedTotalDamage = Math.round(ranked.damage);
    let rankedTotalHealing = Math.round(ranked.heal);
    let rankedMultiplier = 0.72;
    let score = 0;
    if (matchup != null) {
        matchup = matchup.win_rate;
        score += (100 - matchup) * 0.03;
    } else {
        rankedMultiplier += 0.03;
    }
    rankedMultiplier += 0.25; // TODO: decide whether or not to score with unranked
    let damageTenMinutes = (rankedTotalDamage / rankedPlayTime) / 6;
    let healingTenMinutes = (rankedTotalHealing / rankedPlayTime) / 6;
    score += (Math.min(100 * Math.pow(rankedWinrate / 70, 1.8), 100) * 0.38 + rankedMVPRate * 0.11 + rankedSVPRate * 0.05 + Math.min(rankedKDA * (100 / 12), 100) * 0.32
        + Math.min(damageTenMinutes / 120, 100) * 0.06 + Math.min(healingTenMinutes / 220, 100) * 0.08) * rankedMultiplier;
    // Matchup: 3% weight, if the player's winrate against Jeff is 100% then they get 100% score for this section
    // Ranked: 97% weight, +3% if no matchup
    // Within ranked the following weightings apply:
    // Winrate: 38%, giving 100% points at 70% and scaling down, anything lower getting exponentially less points
    // MVPRate: 11%
    // SVPRate: 5%
    // KDA: 32%, capped at 12 KDA
    // Total Damage: 6%, in average damage/10 min, capped at 12,000
    // Total Healing:8%, in average healing/10 min, capped at 22,000
    // scores curved up to give more accurate representation of 1-100 scale
    const rank_history = data.data.rank_history;
    rank_history.sort((a, b) => b.match_time_stamp - a.match_time_stamp);
    let scoreScale;
    try {
        scoreScale = 25 * Math.pow((rank_history[0].score_progression.total_score - 3000) / 2200, 2.1);
    } catch (err) {
        return interaction.editReply({ content: 'Cannot calculate skill level without Jeff games played in ranked this season. (Placement matches do not count)', flags: MessageFlags.Ephemeral });
    }
    console.log(score, scoreScale);
    score += scoreScale;
    const confidence = Math.max(0.5, 5 * Math.pow(1.1, 25 - rankedPlayTime));
    name = data.data.name;
    name = escapeMarkdown(name);
    interaction.editReply({ content: 'Success!', flags: MessageFlags.Ephemeral });
    let reply = `${name}'s Jeff skill score (out of 100): ${Math.min(score.toFixed(2), 100)}±${confidence.toFixed(1)}

Score calculated with ${name}'s Jeff stats for Season ${season}:
        
**Ranked:**
Rank: ${data.data.player.rank.rank}
Winrate against Jeff: ${matchup !== -1 ? `${(100 - matchup)}%` : `Never played against Jeff!`}
Winrate: ${rankedWinrate.toFixed(2)}%
MVP Rate: ${rankedMVPRate.toFixed(2)}%
SVP Rate: ${rankedSVPRate.toFixed(2)}%
KDA: ${rankedKDA.toFixed(2)}
PlayTime: ${rankedPlayTime.toFixed(2)} hours
Average Damage / 10 min: ${Math.round(damageTenMinutes)}
Average Healing / 10 min: ${Math.round(healingTenMinutes)}
                        
Tip: If these stats are outdated, it is because this user was not queried for a while. Please wait for Jeff to refresh stats before running the command again. This should only take a couple of minutes, but could take up to 30 minutes.
        
This command is in development! Please /donatesuggestions if you think the scoring is unfair or unclear in any way!`;
    console.log(reply);
    await interaction.followUp(reply);
}