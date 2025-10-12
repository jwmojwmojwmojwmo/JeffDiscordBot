const { reportError } = require('./utils.js');
const { ownerId } = require('./config.json');

async function sendDailyReminders(client, tbl) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    // TODO: pagination
    const users = await tbl.findAll();
    for (const user of users) {
        if (user.settings?.dailyReminders && user.last_daily < now) {
            try {
                const member = await client.users.fetch(user.userid);
                await member.send("Jeffy wants to remind you to claim your daily! Woop Woop!\n\nYou can turn these reminders off by using /settings.");
            } catch (err) {
                reportError(err);
                console.error(`Failed to DM user ${user.userid}`);
            }
        }
    }
    console.log(`[DailyReminders] Sent reminders at ${new Date().toLocaleString()}`);
}

function scheduleDailyReminders(client, tbl) {
    const now = new Date();
    const nextTimeToDM = new Date(now);
    nextTimeToDM.setHours(15, 0, 0, 0);
    if (nextTimeToDM <= now) {
        nextTimeToDM.setDate(nextTimeToDM.getDate() + 1);
    } 
    const msUntilDM = nextTimeToDM - now;
    console.log(`[DailyReminders] Next run in ${Math.round(msUntilDM / 60000)} min`);
    setTimeout(() => {
        sendDailyReminders(client, tbl);
        setInterval(() => sendDailyReminders(client, tbl), 24 * 60 * 60 * 1000);
    }, msUntilDM);
}

module.exports = { scheduleDailyReminders };