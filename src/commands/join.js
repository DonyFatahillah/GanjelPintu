const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Joins the user\'s current voice channel.'),
  name: 'join', // For prefix command
  async execute(interactionOrMessage) {
    // Check if it's a message (prefix) or interaction (slash)
    const member = interactionOrMessage.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      const response = 'You must be in a voice channel first!';
      if (interactionOrMessage.isChatInputCommand?.()) {
        return interactionOrMessage.reply(response);
      } else {
        return interactionOrMessage.channel.send(response);
      }
    }

    try {
      joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      });

      const response = `Joined voice channel: ${voiceChannel.name}`;
      if (interactionOrMessage.isChatInputCommand?.()) {
        return interactionOrMessage.reply(response);
      } else {
        return interactionOrMessage.channel.send(response);
      }
    } catch (error) {
      console.error(error);
      const response = 'Failed to join the voice channel.';
      if (interactionOrMessage.isChatInputCommand?.()) {
        return interactionOrMessage.reply(response);
      } else {
        return interactionOrMessage.channel.send(response);
      }
    }
  },
};
