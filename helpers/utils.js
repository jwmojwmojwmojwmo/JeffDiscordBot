import item_list from "./itemlist.js";
// Given a table, userid, and username, return the user associated with the information, updating their info, immediately updating only if update === true
// Note that if update === false, the callee must manually do user.save(), or the updated username will not persist. There ane NO CHECKS for this
// Note that if update === true and an unneccesary .save() occurs, it is a performance loss
/**
 * Given a table, userid, and username, return the user associated with the information, updating their info, immediately updating only if update === true
 * @param {number} tbl - database
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
// TODO: ensure equipment is synced with inventory
// given an inventory row, removes some amount of item from that row and deletes row if 0 amount left
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

// given an inventory db, add some amount of item to a user if they have some already, or create a new row if not
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

export class RivalsAPIError extends Error {
    constructor(message, time, info) {
        super(message);
        this.name = 'RivalsAPIError';
        this.time = time;
        this.info = info;
    }
}