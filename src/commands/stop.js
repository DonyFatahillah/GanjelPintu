const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stops the music and clears the queue.'),
  name: 'stop',
  async execute(interactionOrMessage) {
    const isSlash = interactionOrMessage.isChatInputCommand?.();
    const queue = interactionOrMessage.client.distube.getQueue(interactionOrMessage.guildId);

    if (!queue) {
      const response = 'There is no music currently playing!';
      return isSlash
        ? interactionOrMessage.reply({ content: response, ephemeral: true })
        : interactionOrMessage.reply(response);
    }

    try {
      await queue.stop();
      const response = '⏹️ Stopped the music and cleared the queue.';
      return isSlash ? interactionOrMessage.reply(response) : interactionOrMessage.reply(response);
    } catch (error) {
      console.error(error);
      const response = 'Failed to stop the music.';
      return isSlash ? interactionOrMessage.reply(response) : interactionOrMessage.reply(response);
    }
  },
};
