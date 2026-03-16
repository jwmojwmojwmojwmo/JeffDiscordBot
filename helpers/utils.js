import item_list from "./itemlist.js";
// Given a table, userid, and username, return the user associated with the information, updating their info, immediately updating only if update === true
// Note that if update === false, the callee must manually do user.save(), or the updated username will not persist. There ane NO CHECKS for this
// Note that if update === true and an unneccesary .save() occurs, it is a performance loss
/**
 * Given a table, userid, and username, return the user associated with the information, updating their info, immediately updating only if update === true
 * @param {import('sequelize').ModelStatic} tbl - database
 * @param {import('discord.js').Snowflake} user_id - userid
 * @param {String} user_name - username
 * @param {boolean} update - if update === false, the callee must manually do user.save(), or the updated username will not persist. There are NO CHECKS for this. Note that if update === true and an unneccesary .save() occurs, it is a performance loss
 * @returns {object} - user object with updated username. The username has not been saved to the database unless update === true
 */
export async function getUserAndUpdate(tbl, user_id, user_name, update) {
    let user = await tbl.findByPk(user_id);
    if (user) {
        user.username = user_name;
        if (update) {
            await user.save();
        }
    }
    else {
        user = await tbl.create({
            userid: user_id,
            username: user_name,
        });
        const date = new Date();
        console.log('New user created:', user.toJSON(), date.toLocaleString());
    }
    return user;
}

// adds items to item database from itemlist.js
export async function updateItemShop(items_tbl) {
    try {
        console.log("Starting item database sync...");
        for (const item of item_list) {
            await items_tbl.upsert(item);
        }
        console.log(`Successfully synced ${item_list.length} items to the database.`);
        const allItems = await items_tbl.findAll();
        return allItems;
    } catch (error) {
        console.error("Failed to sync item shop:", error);
    }
}

/**
 * Given the equipment database, a row from the inventory database, and amount, remove some amount of the item represented in that row from that user
 * @param {import('sequelize').ModelStatic} eq_tbl - equipment database
 * @param {import('sequelize').Model} tbl_row - a row from the inventory database, which contains a userid mapped to an itemid with some amount
 * @param {number} amount - amount to remove
 */
export async function removeAmountFromInventory(eq_tbl, tbl_row, amount) {
    tbl_row.amount -= amount;
    if (tbl_row.amount === 0) {
        const eq_tbl_row = await eq_tbl.findOne({
            where: { userid: tbl_row.userid, itemid: tbl_row.itemid }
        })
        if (eq_tbl_row) {
            await eq_tbl_row.destroy();
        }
        await tbl_row.destroy();
    } else {
        await tbl_row.save();
    }
}

/**
 * Given the inventory database, userid, item object from the items database, and amount, add that amount of that item to the user
 * @param {import('sequelize').ModelStatic} tbl - inventory database
 * @param {import('discord.js').Snowflake} user_id - userid
 * @param {import('sequelize').Model} item - a row from the items database, which represents an item
 * @param {number} amount - amount to remove
 */
export async function addAmountToInventory(tbl, user_id, item, amount) {
    const itemRow = await tbl.findOne({
        where: {
            userid: user_id,
            itemid: item.itemid
        }
    })
    if (itemRow) {
        itemRow.amount += amount;
        await itemRow.save();
    } else {
        await tbl.create({
            userid: user_id,    
            itemid: item.itemid,
            amount: amount
        });
    }
}

export function getPetLevel(totalXp) {
    const C = 100; // how fast you level up
    const MAX_LEVEL = 10;

    // Calculate current level based on total XP
    let level = Math.floor(Math.sqrt(totalXp / C)) + 1;
    level = Math.min(level, MAX_LEVEL);
    return level;
}

// TODO: lower xp if hunger + affection 0 for too long
export async function updatePetStats(pet, currentLevel) {
    const currentTime = Date.now();
    // use minutes for accuracy
    const msPerMinute = 1000 * 60; 

    // Calculate time elapsed
    const minutesSinceFed = (currentTime - pet.last_fed.getTime()) / msPerMinute;
    const minutesSincePlayed = (currentTime - pet.last_played.getTime()) / msPerMinute;

    const baseDecayPerMinute = 2 / 60;
    const slowDownFactor = (currentLevel == 10) ? 4 : 1 + (0.25 * currentLevel); // increase by slowdown Factor - 1 from 1 (ex max level = 4-1=3x slower than level 1)
    // minutes per point lost
    const minsPerPoint = 1 / (baseDecayPerMinute / slowDownFactor);    

    const hungerDecay = Math.floor(minutesSinceFed / minsPerPoint);
    const affectionDecay = Math.floor(minutesSincePlayed / minsPerPoint);

    // how much extra we're losing but not accounted for since we hit 0 (will be deducted as xp)
    const overHungerDecay = (hungerDecay > pet.hunger) ? hungerDecay - pet.hunger : -1;
    const overAffectionDecay = (affectionDecay > pet.affection) ? affectionDecay - pet.affection : -1;
    // be nice and return xp loss based on avg of the two
    let totalDecay = Math.ceil((overHungerDecay + overAffectionDecay) / 2);
    // essentially we calculate how many minutes its been since the player last interacted
    // then use that to find how many points to subtract
    // then use those minutes again to add to pet.last_fed
    // this way if player checks at the 15 minute mark, we subtract 1 point / 12 minutes
    // if pet.last_fed = Date.now() then we lose all 15 minutes so we lost 3 minutes
    // this way we add 12 to pet.last_fed and the 3 minutes still there
    console.log(`--- PET STATS DEBUG ---`);
    console.log(`Mins Since Fed: ${minutesSinceFed.toFixed(2)}`);
    console.log(`Mins Since Played: ${minutesSincePlayed.toFixed(2)}`);
    console.log(`Mins Per Point: ${minsPerPoint.toFixed(2)}`);
    console.log(`Hunger to subtract: ${hungerDecay}`);
    console.log(`Affection to subtract: ${affectionDecay}`);
    if (hungerDecay > 0) {
        pet.hunger = Math.max(0, pet.hunger - hungerDecay);
        // new date based on adding time
        pet.last_fed = new Date(pet.last_fed.getTime() + (hungerDecay * minsPerPoint * msPerMinute)); 
    }
    if (affectionDecay > 0) {
        pet.affection = Math.max(0, pet.affection - affectionDecay);
        pet.last_played = new Date(pet.last_played.getTime() + (affectionDecay * minsPerPoint * msPerMinute));
    }
    if (totalDecay !== -1) {
        const oldXp = pet.xp;
        pet.xp = Math.max(0, oldXp - totalDecay);
        totalDecay = oldXp - pet.xp; // get actual amount lost
    }
    console.log(`Decay: ${totalDecay}`);
    await pet.save();
    return totalDecay;
}

export class RivalsAPIError extends Error {
    constructor(message, time, info) {
        super(message);
        this.name = 'RivalsAPIError';
        this.time = time;
        this.info = info;
    }
}