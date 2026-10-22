const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skips the current song in queue.'),
  name: 'skip',
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
      const song = await queue.skip();
      const response = `⏭️ Skipped! Now playing: **${song.name}**`;
      return isSlash ? interactionOrMessage.reply(response) : interactionOrMessage.reply(response);
    } catch (error) {
      const response = 'No next song to skip to!';
      return isSlash ? interactionOrMessage.reply(response) : interactionOrMessage.reply(response);
    }
  },
};
