import { VoiceChannel, User, GuildMember, ChannelType } from "discord.js";
import { joinVoiceChannel, VoiceConnection, entersState, VoiceConnectionStatus } from "@discordjs/voice";
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
  private _connection: VoiceConnection | null = null;
  private _currentChannel: VoiceChannel | null = null;
  private _audioRecorder: AudioRecorder;
  private _config: Config;

  constructor(audioRecorder: AudioRecorder, config: Config) {
    this._audioRecorder = audioRecorder;
    this._config = config;
  }

  public getCurrentChannel(): VoiceChannel | null {
    return this._currentChannel;
  }

  checkAutoJoin(channel: VoiceChannel): Promise<boolean> {
    if (this._connection) {
      return Promise.resolve(false); // Already in a voice channel
    }

    // Check if the channel is a voice channel
    if (channel.type !== ChannelType.GuildVoice) {
      return Promise.resolve(false);
    }

    // Check allowed category IDs
    if (this._config.vc_summary.allowed_category_ids.length > 0 &&
        !this._config.vc_summary.allowed_category_ids.includes(channel.parentId || "")) {
      return Promise.resolve(false);
    }

    // Check denied channel IDs
    if (this._config.vc_summary.denied_channel_ids.includes(channel.id)) {
      return Promise.resolve(false);
    }

    const unmutedUsers = this.getUnmutedUsers(channel);
    return Promise.resolve(unmutedUsers.length >= this._config.vc_summary.min_users_to_join);
  }

  async joinChannel(channel: VoiceChannel): Promise<void> {
    if (this._connection && this._connection.state.status !== VoiceConnectionStatus.Destroyed) {
      console.log(`Already connected to a voice channel. Leaving current channel first.`);
      void this.leaveChannel(); // Changed from await this.leaveChannel();
    }

    this._connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false, // Bot should not be deafened to record audio
    });

    this._currentChannel = channel;

    try {
      await entersState(this._connection, VoiceConnectionStatus.Ready, 30_000);
      console.log(`Joined voice channel: ${channel.name}`);

      // Start recording for all current unmuted users
      this.getUnmutedUsers(channel).forEach(user => {
        const member = channel.guild.members.cache.get(user.id);
        if (member && !member.voice.mute && !member.user.bot) {
          this._audioRecorder.startRecording(user.id, this._connection!.receiver);
        }
      });

    } catch (error) {
      this._connection.destroy();
      this._connection = null;
      this._currentChannel = null;
      console.error(`Failed to join voice channel ${channel.name}:`, error);
      throw error;
    }

    this._connection.on(VoiceConnectionStatus.Disconnected, (_oldState, newState) => {
      console.log(`Voice connection disconnected. Reason: ${newState.reason}, Status: ${newState.status}`);
      void this.leaveChannel();
    });
  }

  leaveChannel(): Promise<void> {
    if (this._connection) {
      // Stop all recordings before leaving
      this._currentChannel?.members.forEach(member => {
        if (!member.user.bot) {
          this._audioRecorder.stopRecording(member.id);
        }
      });
      this._connection.destroy();
      this._connection = null;
      this._currentChannel = null;
      console.log("Left voice channel.");
    }
    return Promise.resolve();
  }

  getUnmutedUsers(channel: VoiceChannel): User[] {
    return channel.members
      .filter(member => !member.voice.mute && !member.user.bot)
      .map(member => member.user);
  }

  onUserJoin(member: GuildMember, channel: VoiceChannel): void {
    if (this._currentChannel?.id === channel.id && !member.user.bot && !member.voice.mute) {
      console.log(`User ${member.user.tag} joined and is unmuted. Starting recording.`);
      this._audioRecorder.startRecording(member.id, this._connection!.receiver);
    }
  }

  onUserLeave(member: GuildMember, channel: VoiceChannel): void {
    if (this._currentChannel?.id === channel.id && !member.user.bot) {
      console.log(`User ${member.user.tag} left. Stopping recording.`);
      this._audioRecorder.stopRecording(member.id);

      // Check if all non-bot users have left
      const remainingUsers = channel.members.filter(m => !m.user.bot && !m.voice.mute);
      if (remainingUsers.size === 0) {
        console.log("All non-bot users left. Leaving channel.");
        void this.leaveChannel();
      }
    }
  }
}