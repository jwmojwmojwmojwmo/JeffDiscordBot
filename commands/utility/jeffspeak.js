const { SlashCommandBuilder, bold } = require('discord.js');

const positivemsgs = ["Mrrrr! [eager]",
    "Mrrrr! [playful]",
    "Mrrrr! [supportive]",
    "Ah-Ha! [supportive]",
    "Woop woop! [impressed]",
    "Mrrrr! [relieved]",
    "Mrrrr! [happy]",
    "Mrrrr! [in agreement]",
    "Mrrrr! [friendly]",
    "Mrrrr! [satisfied]",
    "YUMMY YUMMY",
    "NOMNOMNOM",
    "Mrrrr! [triumphant]",
    "Mrrrr! Mrrrr. MRRRR! [excited]"];

const miscmsgs = ["Mrrrr! [mocking]",
    "Mrrrr! [startling]",
    "Mrrrr... [growling]",
    "Mrrrr…? [curious]",
    "Mrrrr -- ? [confused]",
    "Mrrrr! [beckoning]",
    "Mrrrr... [dismissive]",
    "Mrrrr... [impatient]",
    "No!",
    "Uh-Uh!",
    "MRRAAAARR!",
    "Mrrrr? [inquiring]"]

const negativemsgs = [
    "MRRRR! [ravenous]",
    "MRRRR! [vicious]",
    "Mrrr...[sad]",
    "Mrrrr! [urgent]",
    "Mrrrr?! [terrified]",
    "Mrrrr… [snarling]",
    "Mrrrr! [apologetic]",
    "Mrrrr! [shocked]",
    "Mrrrr! [sad]",
    "Uh-Oh! [sad]",
    "Mrrrr… [frustrated]",
    "Mrrrr... [worried]",
    "No! [urgent]",
    "MRRR! [panicked]"
]

const allmsgs = [positivemsgs, miscmsgs, negativemsgs];


function getMsg(index) {
    return bold(allmsgs[index][Math.floor(Math.random() * allmsgs[index].length)]);
}

function fullMsg() {
    let msg = "";
    const index = Math.floor(Math.random() * 3);
    const msgNum = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i <= msgNum; i++) {
        msg = msg + "\n" + getMsg(index);
    }
    return msg;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jeffspeak')
        .setDescription('Say something to Jeff')
        .addStringOption(option =>
            option
                .setName('phrase')
                .setDescription('What you want to say to Jeff')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.reply(interaction.user.globalName + " says: " + interaction.options.getString('phrase') + "\n\n"
            + "Jeff says:" + fullMsg());
    },
};
