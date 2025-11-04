const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { ownerId } = require('../../betaconfig.json');
const fs = require('fs');
const path = require('path');
const { getUserAndUpdate } = require('../../utils.js');
const donationPath = path.join(__dirname, '..', '..', 'donations.txt');

// TODO: use template literals
async function addDonation(user, suggestion) {
    const date = new Date();
    fs.appendFile(donationPath, '\n\n' + suggestion + ', ' + user.username + ', ' + user.userid
        + ', ' + user.settings.donateJeffDM + ', ' + date.toLocaleString(), (err) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log('File written successfully! ' + date.toLocaleString());
        });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('donatesuggestions')
        .setDescription('If you have any suggestions, please write them here, I NEED IDEAS')
        .addStringOption(option =>
            option
                .setName('suggestion')
                .setDescription('Describe your suggestion(s)')
                .setRequired(true)),
    async execute(interaction) {
        const jwmo = await interaction.client.users.fetch(ownerId);
        const user = await getUserAndUpdate(interaction.client.db.jeff, interaction.user.id, interaction.user.username, false);
        await addDonation(user, interaction.options.getString('suggestion'));
        await jwmo.send('A suggestion was donated');
        await interaction.reply({ content: 'Thank you for your suggestion(s)! All ideas are appreciated and will be reviewed and implemented if it\'s a cool enough idea.', flags: MessageFlags.Ephemeral });
    },
};