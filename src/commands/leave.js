const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leaves the current voice channel.'),
  name: 'leave', // For prefix command
  async execute(interactionOrMessage) {
    const isSlash = interactionOrMessage.isChatInputCommand?.();
    const guildId = interactionOrMessage.guildId;
    const client = interactionOrMessage.client;

    try {
      const queue = client.distube?.getQueue(guildId);
      if (queue) {
        await queue.voices.leave();
      } else {
        const connection = getVoiceConnection(guildId);
        if (connection) {
          connection.destroy();
        } else {
          const response = 'I am not connected to any voice channel!';
          return isSlash ? interactionOrMessage.reply(response) : interactionOrMessage.channel.send(response);
        }
      }

      const response = 'Left the voice channel.';
      return isSlash ? interactionOrMessage.reply(response) : interactionOrMessage.channel.send(response);
    } catch (error) {
      console.error(error);
      const response = 'Failed to leave the voice channel.';
      return isSlash ? interactionOrMessage.reply(response) : interactionOrMessage.channel.send(response);
    }
  },
};
