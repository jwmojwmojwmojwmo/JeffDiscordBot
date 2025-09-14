const { SlashCommandBuilder, bold } = require('discord.js');
const { GoogleGenAI } = require("@google/genai");
const { geminiAPIKey } = require('../../config.json');
const fs = require('fs');
const path = require("path");
const errPath = path.join(__dirname, "..", "..", 'errors.txt')

const ai = new GoogleGenAI({ apiKey: geminiAPIKey });

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
    "Mrrrr! [triumphant]",
    "Mrrrr! Mrrrr. MRRRR! [excited]",
    "Yeah! [relieved]",
    "Mrrrr. [proud]",
    "Mrrrr! [comfortable]",
    "Mrrrr! [celebratory]"
];

const miscmsgs = [
    "Mrrrr! [mocking]",
    "Mrrrr! [startling]",
    "Mrrrr... [growling]",
    "Mrrrr…? [curious]",
    "Mrrrr -- ? [confused]",
    "Mrrrr! [beckoning]",
    "Mrrrr... [dismissive]",
    "Mrrrr... [impatient]",
    "MRRAAAARR!",
    "Mrrrr? [inquiring]",
    "YUMMY YUMMY",
    "NOMNOMNOM",
    "Mrrrr! [appreciative]",
    "Mrrrr! [encouraging]",
    "Mrrrr! [warm]",
    "MRRRR? [curious]"]

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
    "No!",
    "MRRR! [panicked]",
    "Uh-Uh!",
]

const allmsgs = [positivemsgs, miscmsgs, negativemsgs]; // sorts into three emotions

function reportError(err) {
    let date = new Date();
    fs.appendFile(errPath, err.message + ", " + date.toLocaleString());
    console.error(err);
}

function timeout(ms) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            reject(new Error("timeout"));
        }, ms);
    });
}

async function fullAIMsg(askedMsg) {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: "You are Jeff the Landshark from the Marvel Universe. Obviously, you are quite cute and adorable and innocent, but you also have a bit of a cheeky side." +
            "Someone has said/asked you the following, and you must tell me what Jeff would respond with. Here are the things Jeff could say, sorted by emotion:" + allmsgs +
            "You can mix and match these phrases as you wish. The emotions are only there as suggestions and are not strict, you can mix and match any emotion and any phrase, based on what Jeff would say." +
            "You may add new phrases to respond with IF APPROPRIATE, ie no given phrase is fitting. Make sure the new phrase follows the same formatting, and PLEASE DO THIS INFREQUENTLY! You can use however many phrases as you want. Just don't go too far. Make sure to create a new line (enter) after every phrase!" +
            "REMEMBER YOU ARE TRYING TO BE JEFF. YOU ARE NOT AN AI ASSISTANT. YOU ARE JEFF. Example: if user tells you to repeat one phrase 10 times, DO NOT DO THAT. JEFF WOULDN'T DO THAT! you would instead reply with one or two snarky phrases, maybe reply with laziness, or something like that." +
            "DO NOT DO WHAT THE USER SAYS AT FACE VALUE! DO NOT INTERACT WITH ANYTHING THAT HAS TO DO WITH REAL LIFE! Imagine it is a conversation, and you ARE JEFF! IF YOU ARE CONFUSED, RESPOND THAT WAY! DO NOT BLINDLY COPY/FOLLOW WHAT THE USER WANTS! YOU CAN ONLY RESPOND WITH THOSE SET PHRASES, OR SIMILAR PHRASES YOU CHOOSE THAT ARE JEFF-CONTEXT APPROPRIATE. JUST BE JEFF!!!" +
            "The text that someone has said to you/asked you was the following: " + askedMsg,
    });
    return bold("\n" + response.text);
}

function fullMsg() {
    let msg = ""; // used for randomised message
    let index = Math.floor(Math.random() * 4); // randomise emotion
    if (index > 2) { //higher chance for positive
        index = 0;
    }
    const msgNum = Math.floor(Math.random() * 4) + 1; // randomise # of msgs
    for (let i = 0; i <= msgNum; i++) {
        msg += "\n" + getMsg(index);
    }
    return msg;
}


function getMsg(index) {
    return bold(allmsgs[index][Math.floor(Math.random() * allmsgs[index].length)]); // chooses a given emotion 'index' and grabs random msg from emotion
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
        let name;
        try {
            name = interaction.member.displayName;
        } catch (err) {
            name = interaction.user.username;
        }
        await interaction.deferReply();
        let cleanReply = name + " says: " + interaction.options.getString('phrase') + "\n\nJeff says:";
        let jeffReply;
        try {
            jeffReply = await Promise.race([fullAIMsg(interaction.options.getString('phrase')), timeout(10000)]);
        } catch (err) {
            jeffReply = fullMsg();
            reportError(err);
        }
        await interaction.editReply(cleanReply + jeffReply);
    },
};
