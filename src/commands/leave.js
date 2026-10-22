const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leaves the current voice channel.'),
  name: 'leave', // For prefix command
  async execute(interactionOrMessage) {
    const guildId = interactionOrMessage.guildId;
    const connection = getVoiceConnection(guildId);

    if (!connection) {
      const response = 'I am not connected to any voice channel!';
      if (interactionOrMessage.isChatInputCommand?.()) {
        return interactionOrMessage.reply(response);
      } else {
        return interactionOrMessage.channel.send(response);
      }
    }

    try {
      connection.destroy();
      const response = 'Left the voice channel.';
      if (interactionOrMessage.isChatInputCommand?.()) {
        return interactionOrMessage.reply(response);
      } else {
        return interactionOrMessage.channel.send(response);
      }
    } catch (error) {
      console.error(error);
      const response = 'Failed to leave the voice channel.';
      if (interactionOrMessage.isChatInputCommand?.()) {
        return interactionOrMessage.reply(response);
      } else {
        return interactionOrMessage.channel.send(response);
      }
    }
  },
};
