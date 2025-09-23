const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const killMsg = [
    " got gobbled by Jeff. Chomp chomp! NOM NOM!",
    " was just swallowed by Jeff whole. Slurp slurp!",
    " is now Jeff’s snack. *nomnomnom*",
    " was caught by Jeff in his jaws. Crunch crunch!",
    " vanished... and Jeff’s tummy says thanks! NOMNOM!",
    " got Jeff’ed. Nomfest initiated!"
];

async function kill_tbl(tbl, to_perish_userid, to_perish_username, the_culprit) { // may utilise the_culprit at a later time
    //console.log(to_perish, the_culprit);
    let victim = await tbl.findByPk(to_perish_userid);
    if (victim) {
        victim.username = to_perish_username;
        victim.num_nommed += 1;
        await victim.save();
    }
    else {
        victim = await tbl.create({
            userid: to_perish_userid,
            username: to_perish_username,
            num_nommed: 1
        });
        console.log(`New user created:`, victim.toJSON());
    }
    // logging culprit, unneeded for now
    // let bully = await tbl.findByPk(the_culprit);
    // if (bully) {
    //     bully.num_queries += 1;
    //     bully.num_namnamnam += 1;
    //     await bully.save();
    // }
    // else {
    //     bully = await tbl.create({
    //         username: the_culprit,
    //         num_namnamnam : 1,
    //         num_queries : 1
    //     });
    //     console.log(`New user created:`, bully.toJSON());
    // }
}

module.exports = {
    cooldown: 7,
    data: new SlashCommandBuilder()
        .setName('jeffnom')
        .setDescription('Nom somebody with Jeff')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Who you want to nom?')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: "This command can't be used in DMs.", flags: MessageFlags.Ephemeral })
        }
        const tbl = interaction.client.db.jeff;
        let name = interaction.options.getMember('user').displayName;
        await kill_tbl(tbl, interaction.options.getUser('user').id, name, interaction.user.username);
        await interaction.reply(name + killMsg[Math.floor(Math.random() * killMsg.length)]); // random kill msg
    },
};