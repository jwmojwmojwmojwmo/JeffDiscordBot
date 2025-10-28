const { SlashCommandBuilder, MessageFlags, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { rivalsAPIKey, ownerId, testerId } = require('../../config.json');
const axios = require("axios");
const fs = require('fs');
const util = require('util');
const rivalsBaseURL = 'https://marvelrivalsapi.com';

const lastUpdate = {}; // playerID: timestamp

function canUpdate(playerId) {
    const now = Date.now();
    const last = lastUpdate[playerId] || 0;
    return now - last >= 30 * 60 * 1000;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skillcheck')
        .setDescription('Checks your skill level at Jeff')
        .addStringOption(option =>
            option
                .setName('player_name')
                .setDescription('In-game name of player to check.')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        let uid;
        try {
            uid = await axios.get(`${rivalsBaseURL}/api/v1/find-player/${interaction.options.getString('player_name')}`,
                {
                    headers: { 'x-api-key': rivalsAPIKey }
                });
        } catch (err) {
            console.log(err);
            if (err.response.status === 400 || err.response.status === 404) {
                return interaction.editReply('Cannot find user, please check you typed the username correctly. Usernames are case-sensitive.');
            } else {
                return interaction.editReply('The API seems to be busy at the moment, please try again in a minute.');
            }
        }
        uid = uid.data.uid;
        console.log(uid);
        if (canUpdate(uid)) {
            try {
                await axios.get(`${rivalsBaseURL}/api/v1/player/${uid}/update`,
                    {
                        headers: { "x-api-key": rivalsAPIKey }
                    }).then(res => {
                        console.log("Player updated request sent!");
                        lastUpdate[uid] = Date.now();
                    });
            } catch (err) {
                console.log("Player is on 30-minute lock, according to the API. Try later.");
            }
        } else {
            console.log("Player is on 30-minute lock. Try later.");
        }
        let data;
        try {
            data = await axios.get(`${rivalsBaseURL}/api/v1/player/${uid}`,
            {
                params: { 'season': 4.5 }, // TODO: decide on whether to use latest season or all seasons or smth else
                headers: { 'x-api-key': rivalsAPIKey }
            });
        } catch (err) {
            if (err.response.status === 403) {
                return interaction.editReply('This user\'s profile is set to private.');
            } else {
                return interaction.editReply('The API seems to be busy at the moment, please try again in a minute.');
            }
        }
        let matchup = data.data.hero_matchups.find(h => h.hero_id === 1047); // matchup is this hero's winrate against yours, ie the player's winrate against jeff is 100%-matchup; competitive only
        let ranked = data.data.heroes_ranked.find(h => h.hero_id === 1047);
        let unranked = data.data.heroes_unranked.find(h => h.hero_id === 1047);
        let rankedWinrate;
        let rankedMVPRate;
        let rankedSVPRate;
        let rankedKDA;
        let rankedPlayTime;
        let rankedTotalDamage;
        let rankedTotalHealing;
        let rankedTotalDamageBlocked;
        let rankedAccuracy;
        let unrankedWinrate;
        let unrankedMVPRate;
        let unrankedSVPRate;
        let unrankedKDA;
        let unrankedPlayTime;
        let unrankedTotalDamage;
        let unrankedTotalHealing;
        let unrankedTotalDamageBlocked;
        let unrankedAccuracy;
        if (matchup != null) {
            matchup = matchup.win_rate;
        }
        if (ranked != null) {
            rankedWinrate = (ranked.wins / ranked.matches) * 100;
            rankedMVPRate = (ranked.mvp / ranked.wins) * 100;
            rankedSVPRate = (ranked.svp / (ranked.matches - ranked.wins)) * 100;
            rankedKDA = (ranked.kills + ranked.assists) / (ranked.deaths);
            rankedPlayTime = ranked.play_time / 3600;
            rankedTotalDamage = Math.round(ranked.damage);
            rankedTotalHealing = Math.round(ranked.heal);
            rankedTotalDamageBlocked = Math.round(ranked.damage_taken);
            rankedAccuracy = (ranked.main_attack.hits / ranked.main_attack.total) * 100;
        }
        if (unranked != null) {
            unrankedWinrate = (unranked.wins / unranked.matches) * 100;
            unrankedMVPRate = (unranked.mvp / unranked.wins) * 100;
            unrankedSVPRate = (unranked.svp / (unranked.matches - unranked.wins)) * 100;
            unrankedKDA = (unranked.kills + unranked.assists) / (unranked.deaths);
            unrankedPlayTime = unranked.play_time / 3600;
            unrankedTotalDamage = Math.round(unranked.damage);
            unrankedTotalHealing = Math.round(unranked.heal);
            unrankedTotalDamageBlocked = Math.round(unranked.damage_taken);
            unrankedAccuracy = (unranked.main_attack.hits / unranked.main_attack.total) * 100;
        }

        await interaction.editReply( // TODO: create scoring system so Jeff can score a player's Jeff skills
`${interaction.options.getString('player_name')} Jeff stats:
Winrate against Jeff: ${matchup ? `${(100 - matchup)}%` : `Never played against Jeff!`}

Ranked:
${ranked ? 
`Winrate: ${rankedWinrate.toFixed(2)}%
MVP Rate: ${rankedMVPRate.toFixed(2)}%
SVP Rate: ${rankedSVPRate.toFixed(2)}%
KDA: ${rankedKDA.toFixed(2)}
PlayTime: ${rankedPlayTime.toFixed(2)} hours
Total Damage: ${rankedTotalDamage}
Total Healing: ${rankedTotalHealing}
Total Damage Blocked: ${rankedTotalDamageBlocked}
Accuracy: ${rankedAccuracy.toFixed(2)}%` :
`Never played ranked with Jeff!`}

Unranked:
${unranked ?
`Winrate: ${unrankedWinrate.toFixed(2)}%
MVP Rate: ${unrankedMVPRate.toFixed(2)}%
SVP Rate: ${unrankedSVPRate.toFixed(2)}%
KDA: ${unrankedKDA.toFixed(2)}
PlayTime: ${unrankedPlayTime.toFixed(2)} hours
Total Damage: ${unrankedTotalDamage}
Total Healing: ${unrankedTotalHealing}
Total Damage Blocked: ${unrankedTotalDamageBlocked}
Accuracy: ${unrankedAccuracy.toFixed(2)}%` :
`Never played unranked with Jeff!`}`);
    },
};