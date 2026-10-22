const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays audio from YouTube, SoundCloud, or Spotify with 240kbps quality.')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('The URL (YouTube, SoundCloud, Spotify) or song title')
        .setRequired(true)
    ),
  name: 'play',
  async execute(interactionOrMessage, args) {
    const isSlash = interactionOrMessage.isChatInputCommand?.();
    const member = interactionOrMessage.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel) {
      const response = 'You must be in a voice channel first to play audio!';
      return isSlash
        ? interactionOrMessage.reply({ content: response, ephemeral: true })
        : interactionOrMessage.reply(response);
    }

    let query = '';
    if (isSlash) {
      query = interactionOrMessage.options.getString('query');
    } else {
      query = args?.join(' ') || '';
    }

    if (!query || !query.trim()) {
      const response = 'Please provide a valid URL or search term! Example: `g!play <link>`';
      return isSlash
        ? interactionOrMessage.reply({ content: response, ephemeral: true })
        : interactionOrMessage.reply(response);
    }

    try {
      if (isSlash) {
        await interactionOrMessage.deferReply();
      }

      const client = interactionOrMessage.client;
      await client.distube.play(voiceChannel, query.trim(), {
        member: member,
        textChannel: interactionOrMessage.channel,
        message: isSlash ? undefined : interactionOrMessage,
      });

      if (isSlash) {
        await interactionOrMessage.editReply(`🔍 Processing your request for: **${query}**`);
      }
    } catch (error) {
      console.error('[Play Error]:', error);
      const errorMsg = `❌ Failed to play: ${error.message}`;
      if (isSlash) {
        if (interactionOrMessage.deferred || interactionOrMessage.replied) {
          await interactionOrMessage.editReply(errorMsg);
        } else {
          await interactionOrMessage.reply({ content: errorMsg, ephemeral: true });
        }
      } else {
        interactionOrMessage.reply(errorMsg);
      }
    }
  },
};
