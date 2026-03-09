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

export async function updatePetStats(pet, currentLevel) {
    const currentTime = Date.now();
    const msPerHour = 1000 * 60 * 60;

    // Calculate time elapsed
    const hoursSinceFed = (currentTime - pet.last_interacted) / msPerHour;
    const hoursSincePlayed = (currentTime - pet.last_interacted) / msPerHour;

    const baseDecayPerHour = 5;
    const slowDownFactor = 1 + (0.5 * (currentLevel - 1));

    const hungerDecay = Math.floor((hoursSinceFed * baseDecayPerHour) / slowDownFactor);
    const affectionDecay = Math.floor((hoursSincePlayed * baseDecayPerHour) / slowDownFactor);
    if (hungerDecay > 0) {
        pet.hunger = Math.max(0, pet.hunger - hungerDecay);
        pet.last_interacted = currentTime;
    }
    if (affectionDecay > 0) {
        pet.affection = Math.max(0, pet.affection - affectionDecay);
        pet.last_interacted = currentTime;
    }

    await pet.save();
}

export class RivalsAPIError extends Error {
    constructor(message, time, info) {
        super(message);
        this.name = 'RivalsAPIError';
        this.time = time;
        this.info = info;
    }
}