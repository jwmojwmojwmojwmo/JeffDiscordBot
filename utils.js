const fs = require('fs');
const path = require('path');
const errPath = path.join(__dirname, '..', '..', 'errors.txt');

// Given a table, userid, and username, return the user associated with the information, updating their info, immediately updating only if update === true
// Note that if update === false, the callee must manually do user.save(), or the updated username will not persist. There ane NO CHECKS for this
// Note that if update === true and an unneccesary .save() occurs, it is a performance loss
async function getUserAndUpdate(tbl, user_id, user_name, update) {
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

// Given an error, record it in errors.txt and log it in console
function reportError(err) {
	const date = new Date();
	fs.appendFileSync(errPath, err.stack + ', ' + date.toLocaleString() + '\n\n');
	console.error(err);
}

module.exports = { getUserAndUpdate, reportError };