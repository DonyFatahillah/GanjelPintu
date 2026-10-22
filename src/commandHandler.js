const fs = require('fs');
const path = require('path');
const { Collection, REST, Routes } = require('discord.js');

module.exports = {
  loadCommands(client) {
    client.commands = new Collection();
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      
      // Load for slash commands
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      }
      
      // Load for prefix commands (using the 'name' property)
      if ('name' in command && !client.commands.has(command.name)) {
        client.commands.set(command.name, command);
      }
    }
    
    console.log(`Successfully loaded ${client.commands.size} commands.`);
  },

  async registerSlashCommands(token, clientId, guildId, client) {
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file));
      if ('data' in command) {
        commands.push(command.data.toJSON());
      }
    }

    const rest = new REST({ version: '10' }).setToken(token);

    try {
      console.log(`Started refreshing ${commands.length} application (/) commands.`);

      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
      );

      console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
      console.error('Error registering slash commands:', error);
    }
  },
};
