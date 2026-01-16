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

export class RivalsAPIError extends Error {
    constructor(message, time, info) {
        super(message);
        this.name = 'RivalsAPIError';
        this.time = time;
        this.info = info;
    }
}