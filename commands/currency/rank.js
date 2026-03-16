import { SlashCommandBuilder, EmbedBuilder, escapeMarkdown } from 'discord.js';
import { Op } from 'sequelize';
import { getUserAndUpdate } from '../../helpers/utils.js';

export const data = new SlashCommandBuilder()
    .setName('rank')
    .setDescription("Check your rank")
export async function execute(interaction) {
    const user = await getUserAndUpdate(interaction.client.db.jeff, interaction.user.id, interaction.member?.displayName || interaction.user.displayName, true);
    //Calculate their rank number by counting how many people have MORE reputation than them
    let rank = await interaction.client.db.jeff.count({
        where: {
            reputation: {
                [Op.gt]: user.reputation
            }
        }
    });
    rank++;
    let rankTitle = "";
    let flavorText = "";
    let embedColor = 0x80aaff; // Default blue

    // TODO: USE NOM COUNT!
    if (rank === 1 && user.reputation > 250) {
        rankTitle = "🏆 Jeff's Favorite Human";
        flavorText = "You are the Gwenpool to his Jeff. He would gladly bite a supervillain for you.";
        embedColor = 0xffd700; // Gold
    } else if (user.reputation >= 250) {
        rankTitle = "🌊 Ocean Overlord";
        flavorText = "You’ve earned the highest honor: Jeff actually shares his food with you.";
        embedColor = 0x9932cc; // Purple
    } else if (user.reputation >= 150) {
        rankTitle = "💙 Jeff's Close Friend";
        flavorText = "He enthusiastically wags his tail when he sees you. You're definitely on the VIP list.";
        embedColor = 0x00ff00; // Green
    } else if (user.reputation >= 50) {
        rankTitle = "👋 Jeff's Acquaintance";
        flavorText = "You're the human who feeds him every day while he pranks and torments you. It's a thankless job, but somebody's gotta do it, and you know he likes you deep down.";
    } else if (user.reputation >= 15) {
        rankTitle = "🦴 Acceptable Snack";
        flavorText = "Jeff is currently deciding if you are a friend or food. Proceed carefully.";
    } else {
        rankTitle = "🪵 Driftwood";
        flavorText = "Who are you again? Jeff hissed at you earlier.";
        embedColor = 0x808080; // Gray
    }
    const rankEmbed = new EmbedBuilder()
        .setTitle(`${escapeMarkdown(`${interaction.member?.displayName || interaction.user.displayName}`)}'s Reputation Profile`)
        .setColor(embedColor)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
            { name: 'Global Rank', value: `#${rank}`, inline: true },
            { name: 'Reputation', value: `${user.reputation}`, inline: true },
            { name: 'Current Title', value: `__${rankTitle}__\n*${flavorText}*`, inline: false }
        )

    // 5. Send it!
    await interaction.reply({ embeds: [rankEmbed] });
}