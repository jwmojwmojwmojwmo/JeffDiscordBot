const { SlashCommandBuilder, bold } = require('discord.js');

const msgs = ["MRRRR! [ravenous]", "MRRRR! [vicious]", "Mrrr...[sad]", "Mrrrr! [eager]", "Mrrrr! [urgent]",
    "Mrrrr! [mocking]", "Mrrrr! [startling]", "Mrrrr! [playful]", "Mrrrr! [supportive]", "Mrrrr... [growling]", "Mrrrr…? [curious]",
    "Mrrrr?! [terrified]", "Mrrrr! Mrrrr. MRRRR! [excited]", "Mrrrr! [triumphant]", "Mrrrr… [snarling]", "Mrrrr! [apologetic]", "MRRAAAARR!",
    "Mrrrr! [shocked]", "Mrrrr! [sad]", "Uh-Oh! [sad]", "Ah-Ha! [supportive]", "Woop woop! [impressed]", "Mrrrr! [relieved]", "Mrrrr! [happy]",
    "Mrrrr -- ? [confused]", "Mrrrr… [frustrated]", "Mrrrr! [in agreement]", "No!", "Uh-Uh!", "Mrrrr! [beckoning]", "Mrrrr! [friendly]", "Mrrrr... [worried]",
    "Mrrrr... [dismissive]", "Mrrrr... [impatient]", "Mrrrr! [satisfied]", "No! [urgent]", "MRRR! [panicked]"];

function getMsg() {
    return bold(msgs[Math.floor(Math.random() * msgs.length)]);
}

function fullMsg() {
    let msg = "";
    const msgNum = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i <= msgNum; i++) {
        msg = msg + "\n" + getMsg();
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
