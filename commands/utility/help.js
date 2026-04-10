import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows a detailed list of all the things Jeff can do!');

export async function execute(interaction) {
    const helpEmbed = new EmbedBuilder()
        .setTitle('Jeff Bot Commands')
        .setColor(0x80aaff)
        .setDescription('Here is a list of everything you can do with Jeff! \n*(Note: `<arg>` means required, `[arg]` means optional)*')
        .addFields(
            {
                name: 'Economy & Items',
                value: `\`/daily\` - Get your daily energy check-in
\`/fish\` - Go fishing for items and goodies (costs 5 energy)
\`/inventory [user]\` - Look at your own or someone else's inventory
\`/item <item>\` - See stats, descriptions, and rarity of a specific item
\`/trader\` - Check Jeff's Trading Post to buy things
\`/use <item>\` - Consume or equip an item from your inventory
\`/gift <user> <amount>\` - Gift energy to another user (Jeff might eat some as tax)
\`/bubble <user>\` - Bubble someone to give them reputation (costs 25 energy)
\`/spit <user>\` - Spit on someone to lower their reputation (costs 25 energy)
\`/nap\` - Put Jeff to sleep to passively earn energy while you're away
\`/vote\` - Vote for Jeff Bot on Top.gg for extra rewards`
            },
            {
                name: ' Stats & Leaderboards',
                value: `\`/stats [user] [stat_type]\` - See a user's stats (nom count, energy, reputation)
\`/rank\` - Check your reputation title and global rank
\`/leaderboard <stat_type> [scope]\` - View the global or server leaderboards for specific stats`
            },
            {
                name: 'Fun & Games',
                value: `\`/jeff\` - Get a random picture of Jeff the Landshark
\`/nom <user>\` - Have Jeff nom somebody
\`/speak <phrase>\` - Talk to Jeff and see how he reacts
\`/play highlow\` - Guess if the number Jeff is thinking of is higher or lower
\`/play blackjack <bet>\` - Bet reputation to play blackjack against Jeff
\`/quiz\` - Answer Jeff trivia to earn energy
\`/skillcheck <player>\` - Check a player's Marvel Rivals Jeff skill score`
            },
            {
                name: 'Pets',
                value: `\`/pet view\` - Check your pet's stats (hunger, affection, xp)
\`/pet feed\` - Feed your pet
\`/pet pet\` - Pet your companion
\`/pet play\` - Play with your pet
\`/pet disown\` - Release your pet back into the wild`
            },
            {
                name: 'Utility',
                value: `\`/about\` - See bot info and links
\`/status\` - Check the bot's current status and update log
\`/settings\` - Change user preferences and configure account
\`/ping\` - Check bot latency
\`/donatejeff <picture>\` - Submit a Jeff picture to be added to the bot
\`/donatesuggestions <suggestion>\` - Send an idea to the developer
\`/help\` - Shows a detailed list of all the things Jeff can do!`
            }
        )
        .setFooter({ text: 'Any additional questions? The developer is available on Discord! Username: jwmo' });

    console.log(`${interaction.user.username} checked the help menu.`);

    await interaction.reply({ embeds: [helpEmbed], flags: MessageFlags.Ephemeral });
}