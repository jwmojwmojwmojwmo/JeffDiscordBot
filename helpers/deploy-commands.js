import { REST, Routes } from 'discord.js';
import config from './config.json' with { type: "json" };
const { clientId } = config;
const { guildId } = config;
const { token } = config;
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, '../commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const commandModule = await import(pathToFileURL(filePath).href);
        const command = commandModule.default || commandModule;

        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// //TODO: change file dir of folder commands and main fn utils and schedulers
// for (const folder of commandFolders) {
// 	// Grab all the command files from the commands directory you created earlier
// 	const commandsPath = join(foldersPath, folder);
// 	const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
// 	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
// 	for (const file of commandFiles) {
// 		const filePath = join(commandsPath, file);
// 		const command = require(filePath);
// 		if ('data' in command && 'execute' in command) {
// 			commands.push(command.data.toJSON());
// 		}
// 		else {
// 			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
// 		}
// 	}
// }

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {

	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	}
	catch (error) {
		console.error(error);
	}
})();
