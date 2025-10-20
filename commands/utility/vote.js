const { SlashCommandBuilder, MessageFlags, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { topggAPIKey, ownerId, testerId } = require('../../config.json');
const { getUserAndUpdate } = require('../../utils.js');
const Topgg = require("@top-gg/sdk");
const TopggAPI = new Topgg.Api(topggAPIKey);

const TopGGButton = new ButtonBuilder()
    .setURL('https://top.gg/bot/1403391763510464663')
    .setLabel('TopGG')
    .setStyle(ButtonStyle.Link);
const buttonRow = new ActionRowBuilder().addComponents(TopGGButton);

// TODO: webhook migration
// returns 1 if user voted and did not claim reward yet, 2 if has not voted yet, else return energy rewarded
async function getVote(tbl, user_id, user_name) {
    let user = await getUserAndUpdate(tbl, user_id, user_name, false);
    let voted = await TopggAPI.hasVoted(user_id);
    let reward = 25;
    if (!voted) {
        user.claimedVote = false;
        await user.save();
        return 2;
    }
    if (user.claimedVote) {
        await user.save();
        return 1;
    }
    user.claimedVote = true;
    if (await TopggAPI.isWeekend()) {
        reward = reward * 2;
    }
    user.energy += reward;
    await user.save();
    return reward;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vote')
        .setDescription('Vote for Jeff Bot for additional rewards!'),
    async execute(interaction) {
        const name = interaction.member?.displayName || interaction.user.username;
        const id = interaction.user.id;
        if (!(id === ownerId || id === testerId)) {
            console.log(`${name} (${id}) tried to vote.`)
            return interaction.reply('This command is currently undergoing testing!');
        }
        await interaction.reply({content: `Fetching vote information...`, flags: MessageFlags.Ephemeral});
        let success = await getVote(interaction.client.db.jeff, id, name);
        if (success === 2) {
            await interaction.editReply({ content: `You haven't voted yet! Vote at top.gg and run /vote again to claim your reward! Rewards doubled on weekends!`, components: [buttonRow], flags: MessageFlags.Ephemeral });
            console.log(`${name} (${id}) ran /vote and has not voted yet.`);
        } else if (success === 1) {
            await interaction.editReply({ content: `You’ve already claimed your vote rewards today! (If this is in error, please remember to run /vote before AND after you vote so the bot can update your vote status accordingly. Jeffy knows this is quite annoying, so it will hopefully be patched in upcoming updates.)`, flags: MessageFlags.Ephemeral });
            console.log(`${name} (${id}) ran /vote and already claimed rewards.`);
        } else {
            await interaction.editReply({ content: `Thanks for voting! +${success} energy! ${success === 25 ? '' : ' (Rewards doubled because it is a weekend!)'}`, flags: MessageFlags.Ephemeral });
            console.log(`${name} (${id}) ran /vote and claimed rewards.`);
        }
    },
};