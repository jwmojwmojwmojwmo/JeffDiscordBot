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
module.exports = {
    data: new SlashCommandBuilder()
        .setName('vote')
        .setDescription('Vote for Jeff Bot for additional rewards!'),
    async execute(interaction) {
        const name = interaction.member?.displayName || interaction.user.username;
        const id = interaction.user.id;
        await interaction.reply({ content: `Fetching vote information...`, flags: MessageFlags.Ephemeral });
        const user = await getUserAndUpdate(interaction.client.db.jeff, id, name, false);
        const voted = await TopggAPI.hasVoted(id);
        let reward = 25;
        // rewarding logic
        if (!voted) {
            user.claimedVote = false;
            await user.save();
            console.log(`${name} (${id}) ran /vote and has not voted yet.`);
            await interaction.editReply({ content: `You haven't voted yet! Vote at top.gg and run /vote again to claim your reward! Rewards doubled on weekends!`, components: [buttonRow], flags: MessageFlags.Ephemeral });

        } else if (user.claimedVote) {
            await user.save();
            console.log(`${name} (${id}) ran /vote and already claimed rewards.`);
            await interaction.editReply({ content: `You’ve already claimed your vote rewards today! (If this is in error, please remember to run /vote before AND after you vote so the bot can update your vote status accordingly. Jeffy knows this is quite annoying, so it will hopefully be patched in upcoming updates.)`, flags: MessageFlags.Ephemeral });
        } else {
            user.claimedVote = true;
            if (await TopggAPI.isWeekend()) {
                reward = reward * 2;
            }
            user.energy += reward;
            await user.save();
            await interaction.editReply({ content: `Thanks for voting! +${reward} energy! ${reward === 25 ? '' : ' (Rewards doubled because it is a weekend!)'}`, flags: MessageFlags.Ephemeral });
            console.log(`${name} (${id}) ran /vote and claimed rewards.`);
        }
    },
};