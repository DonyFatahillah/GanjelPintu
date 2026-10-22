require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { DisTube } = require('distube');
const { YouTubePlugin } = require('@distube/youtube');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { SpotifyPlugin } = require('@distube/spotify');
const { loadCommands, registerSlashCommands } = require('./commandHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

// Configure DisTube with 240kbps audio bitrate and multi-source plugins
const distube = new DisTube(client, {
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: false,
  emitAddListWhenCreatingQueue: false,
  plugins: [
    new YouTubePlugin(),
    new SoundCloudPlugin(),
    new SpotifyPlugin(),
  ],
  ffmpeg: {
    path: 'ffmpeg',
    args: {
      global: {},
      input: {},
      output: {
        'b:a': '240k',
        'ar': '48000',
        'ac': '2',
      },
    },
  },
});

client.distube = distube;

// DisTube Event Notifications
distube
  .on('playSong', (queue, song) => {
    queue.textChannel?.send(
      `🎶 Now playing: **[${song.name}](${song.url})** (\`${song.formattedDuration}\`) | Quality: \`240kbps\` | Requested by: ${song.user}`
    ).catch(() => {});
  })
  .on('addSong', (queue, song) => {
    queue.textChannel?.send(
      `✅ Added to queue: **[${song.name}](${song.url})** (\`${song.formattedDuration}\`)`
    ).catch(() => {});
  })
  .on('addList', (queue, playlist) => {
    queue.textChannel?.send(
      `✅ Added playlist **[${playlist.name}](${playlist.url})** (${playlist.songs.length} songs) to the queue!`
    ).catch(() => {});
  })
  .on('error', (channel, error) => {
    console.error('[DisTube Error]:', error);
    channel?.send(`❌ Playback error: ${error.message.slice(0, 1900)}`).catch(() => {});
  })
  .on('empty', (queue) => {
    queue.textChannel?.send('Voice channel is empty! Leaving...').catch(() => {});
  });

const prefixes = ['g!', 'g-'];
const TARGET_CATEGORY_ID = process.env.VOICE_CATEGORY_ID || '1217122967423811696';
const TARGET_ROLE_ID = process.env.VOICE_ROLE_ID || '1547842817320034344';

// Load all command files
loadCommands(client);

client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);

  // Register slash commands to the specified guild
  const { TOKEN, GUILD_ID } = process.env;
  if (TOKEN && GUILD_ID) {
    await registerSlashCommands(TOKEN, c.user.id, GUILD_ID, client);
  } else {
    console.warn('TOKEN or GUILD_ID is missing from .env file. Slash command registration skipped.');
  }
});

// Handle Slash Commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

// Handle Prefix Commands (e.g. g!play, g-play)
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const matchedPrefix = prefixes.find((p) => message.content.startsWith(p));
  if (!matchedPrefix) return;

  const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply('There was an error trying to execute that command!');
  }
});

// Handle Voice State Updates (Auto-assign role in category)
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  // If the user's voice channel hasn't changed (e.g. mute/unmute/deafen/stream), ignore
  if (oldState.channelId === newState.channelId) return;

  const guild = newState.guild || oldState.guild;
  if (!guild) return;

  try {
    // Resolve guild member
    const member = newState.member || oldState.member || await guild.members.fetch(newState.id || oldState.id).catch(() => null);
    if (!member || member.user.bot) return;

    // Resolve old and new channels
    const oldChannel = oldState.channel || (oldState.channelId ? await guild.channels.fetch(oldState.channelId).catch(() => null) : null);
    const newChannel = newState.channel || (newState.channelId ? await guild.channels.fetch(newState.channelId).catch(() => null) : null);

    const oldCategoryId = oldChannel?.parentId;
    const newCategoryId = newChannel?.parentId;

    const wasInTargetCategory = oldCategoryId === TARGET_CATEGORY_ID;
    const isInTargetCategory = newCategoryId === TARGET_CATEGORY_ID;

    // Player joined a channel in the target category (from outside or disconnected)
    if (!wasInTargetCategory && isInTargetCategory) {
      if (!member.roles.cache.has(TARGET_ROLE_ID)) {
        await member.roles.add(TARGET_ROLE_ID);
        console.log(`[AutoRole] Added role ${TARGET_ROLE_ID} to ${member.user.tag} (${member.id})`);
      }
    }

    // Player left the target category (disconnected or switched to a channel outside the category)
    if (wasInTargetCategory && !isInTargetCategory) {
      if (member.roles.cache.has(TARGET_ROLE_ID)) {
        await member.roles.remove(TARGET_ROLE_ID);
        console.log(`[AutoRole] Removed role ${TARGET_ROLE_ID} from ${member.user.tag} (${member.id})`);
      }
    }
  } catch (error) {
    console.error(`[AutoRole] Error updating role for member ${newState.id || oldState.id}:`, error);
  }
});

client.login(process.env.TOKEN).catch((err) => {
  console.error('Failed to log in:', err.message);
});
