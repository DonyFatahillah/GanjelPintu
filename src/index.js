require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { loadCommands, registerSlashCommands } = require('./commandHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const prefix = 'g-';
const TARGET_CATEGORY_ID = process.env.VOICE_CATEGORY_ID || '1217122967423811696';
const TARGET_ROLE_ID = process.env.VOICE_ROLE_ID || '1547842817320034344';

// Load all command files
loadCommands(client);

client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  console.log(`test updt`)
  
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

// Handle Prefix Commands
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);

  if (!command) return;

  try {
    await command.execute(message);
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

client.login(process.env.TOKEN).catch(err => {
  console.error('Failed to log in:', err.message);
});
