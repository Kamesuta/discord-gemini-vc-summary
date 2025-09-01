import { Message, OmitPartialGroupDMChannel, VoiceState } from "discord.js";
import { VoiceManagerImpl } from "./services/VoiceManager.js";
import { MemoryManager } from "./services/MemoryManager.js";
import { GeminiServiceImpl } from "./services/GeminiService.js";
import { Config } from "./utils/config.js";

/**
 * Sample function to reply with "Hello" when the bot is mentioned
 * @param message The message where the bot was mentioned
 */
export async function onMentionMessage(
  message: OmitPartialGroupDMChannel<Message>,
): Promise<void> {
  // Check if the bot was mentioned
  if (!message.mentions.has(message.client.user)) {
    return;
  }

  // Reply with "Hello" in the channel where the bot was mentioned
  await message.channel.send(`Hello! ${message.author.username}!`);
}

export async function onVoiceStateUpdate(
  oldState: VoiceState,
  newState: VoiceState,
  voiceManager: VoiceManagerImpl,
  memoryManager: MemoryManager,
  geminiService: GeminiServiceImpl,
  config: Config,
): Promise<void> {
  // User joined a voice channel
  if (!oldState.channelId && newState.channelId) {
    const newChannel = newState.channel;
    if (newChannel && newChannel.isVoiceBased() && newState.member) {
      console.log(`${newState.member.user.tag} joined voice channel ${newChannel.name}`);
      // Check for auto-join conditions
      if (await voiceManager.checkAutoJoin(newChannel)) {
        await voiceManager.joinChannel(newChannel);
      }
      // Handle new user joining an already managed channel
      if (voiceManager.currentChannel?.id === newChannel.id) {
        voiceManager.onUserJoin(newState.member, newChannel);
        // Generate and send "今北三行" message
        const recentSummary = memoryManager.getMediumTermContext(); // Or get a more recent one
        const currentActivity = memoryManager.getCurrentActivity();
        const welcomeMessage = await geminiService.generateWelcomeMessage(currentActivity, recentSummary);
        const textChannel = newChannel.guild.channels.cache.get(config.vc_summary.summary_channel_id);
        if (textChannel && textChannel.isTextBased()) {
          await (textChannel as TextChannel).send(`${newState.member.user.tag}さん、ようこそ！\n${welcomeMessage}`);
        }
      }
    }
  }
  // User left a voice channel
  else if (oldState.channelId && !newState.channelId) {
    const oldChannel = oldState.channel;
    if (oldChannel && oldChannel.isVoiceBased() && oldState.member) {
      console.log(`${oldState.member.user.tag} left voice channel ${oldChannel.name}`);
      if (voiceManager.currentChannel?.id === oldChannel.id) {
        voiceManager.onUserLeave(oldState.member, oldChannel);
      }
    }
  }
  // User moved channels or changed mute/deaf status
  else if (oldState.channelId && newState.channelId && oldState.channelId === newState.channelId) {
    // Mute/Unmute status change
    if (oldState.selfMute !== newState.selfMute || oldState.serverMute !== newState.serverMute) {
      const channel = newState.channel;
      if (channel && channel.isVoiceBased() && newState.member) {
        if (voiceManager.currentChannel?.id === channel.id) {
          if (newState.member.voice.mute && !oldState.member?.voice.mute) {
            console.log(`${newState.member.user.tag} muted themselves.`);
            voiceManager.onUserLeave(newState.member, channel); // Treat as leaving for recording purposes
          } else if (!newState.member.voice.mute && oldState.member?.voice.mute) {
            console.log(`${newState.member.user.tag} unmuted themselves.`);
            voiceManager.onUserJoin(newState.member, channel); // Treat as joining for recording purposes
          }
        }
      }
    }
  }
}
