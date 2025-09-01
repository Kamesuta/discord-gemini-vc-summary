import { Client, VoiceChannel, User, GuildMember, ChannelType } from "discord.js";
import { joinVoiceChannel, VoiceConnection, entersState, VoiceConnectionStatus, EndBehaviorType, get  } from "@discordjs/voice";
import { Config } from "../utils/config.js";
import { AudioRecorder } from "./AudioRecorder.js";

interface VoiceManager {
  checkAutoJoin(channel: VoiceChannel): Promise<boolean>;
  joinChannel(channel: VoiceChannel): Promise<void>;
  leaveChannel(): Promise<void>;
  getUnmutedUsers(channel: VoiceChannel): User[];
  onUserJoin(member: GuildMember, channel: VoiceChannel): void;
  onUserLeave(member: GuildMember, channel: VoiceChannel): void;
}

export class VoiceManagerImpl implements VoiceManager {
  private connection: VoiceConnection | null = null;
  private currentChannel: VoiceChannel | null = null;
  private audioRecorder: AudioRecorder;
  private config: Config;

  constructor(audioRecorder: AudioRecorder, config: Config) {
    this.audioRecorder = audioRecorder;
    this.config = config;
  }

  async checkAutoJoin(channel: VoiceChannel): Promise<boolean> {
    if (this.connection) {
      return false; // Already in a voice channel
    }

    // Check if the channel is a voice channel
    if (channel.type !== ChannelType.GuildVoice) {
      return false;
    }

    // Check allowed category IDs
    if (this.config.vc_summary.allowed_category_ids.length > 0 &&
        !this.config.vc_summary.allowed_category_ids.includes(channel.parentId || "")) {
      return false;
    }

    // Check denied channel IDs
    if (this.config.vc_summary.denied_channel_ids.includes(channel.id)) {
      return false;
    }

    const unmutedUsers = this.getUnmutedUsers(channel);
    return unmutedUsers.length >= this.config.vc_summary.min_users_to_join;
  }

  async joinChannel(channel: VoiceChannel): Promise<void> {
    if (this.connection && this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
      console.log(`Already connected to a voice channel. Leaving current channel first.`);
      await this.leaveChannel();
    }

    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false, // Bot should not be deafened to record audio
    });

    this.currentChannel = channel;

    try {
      await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
      console.log(`Joined voice channel: ${channel.name}`);

      // Start recording for all current unmuted users
      this.getUnmutedUsers(channel).forEach(user => {
        const member = channel.guild.members.cache.get(user.id);
        if (member && !member.voice.mute && !member.user.bot) {
          this.audioRecorder.startRecording(user.id, this.connection!.receiver);
        }
      });

    } catch (error) {
      this.connection.destroy();
      this.connection = null;
      this.currentChannel = null;
      console.error(`Failed to join voice channel ${channel.name}:`, error);
      throw error;
    }

    this.connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
      if (newState.reason === VoiceConnectionStatus.WebSocketDisconnected ||
          newState.reason === VoiceConnectionStatus.Destroyed) {
        console.log("Voice connection disconnected or destroyed.");
        this.leaveChannel();
      }
    });
  }

  async leaveChannel(): Promise<void> {
    if (this.connection) {
      // Stop all recordings before leaving
      this.currentChannel?.members.forEach(member => {
        if (!member.user.bot) {
          this.audioRecorder.stopRecording(member.id);
        }
      });
      this.connection.destroy();
      this.connection = null;
      this.currentChannel = null;
      console.log("Left voice channel.");
    }
  }

  getUnmutedUsers(channel: VoiceChannel): User[] {
    return channel.members
      .filter(member => !member.voice.mute && !member.user.bot)
      .map(member => member.user);
  }

  onUserJoin(member: GuildMember, channel: VoiceChannel): void {
    if (this.currentChannel?.id === channel.id && !member.user.bot && !member.voice.mute) {
      console.log(`User ${member.user.tag} joined and is unmuted. Starting recording.`);
      this.audioRecorder.startRecording(member.id, this.connection!.receiver);
    }
  }

  onUserLeave(member: GuildMember, channel: VoiceChannel): void {
    if (this.currentChannel?.id === channel.id && !member.user.bot) {
      console.log(`User ${member.user.tag} left. Stopping recording.`);
      this.audioRecorder.stopRecording(member.id);

      // Check if all non-bot users have left
      const remainingUsers = channel.members.filter(m => !m.user.bot && !m.voice.mute);
      if (remainingUsers.size === 0) {
        console.log("All non-bot users left. Leaving channel.");
        this.leaveChannel();
      }
    }
  }
}
