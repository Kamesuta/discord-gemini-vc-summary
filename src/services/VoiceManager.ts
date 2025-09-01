import { VoiceChannel, User, GuildMember, ChannelType } from "discord.js";
import { joinVoiceChannel, VoiceConnection, entersState, VoiceConnectionStatus } from "@discordjs/voice";
import { Config } from "../utils/config.js";
import { AudioRecorder } from "./AudioRecorder.js";

/**
 * ボイスチャンネルの管理とユーザーの監視を行うクラス
 */
export class VoiceManagerImpl implements VoiceManager {
  private _connection: VoiceConnection | null = null;
  private _currentChannel: VoiceChannel | null = null;
  private _audioRecorder: AudioRecorder;
  private _config: Config;

  /**
   * VoiceManagerImplのコンストラクタ
   * @param audioRecorder 音声録音サービス
   * @param config 設定情報
   */
  constructor(audioRecorder: AudioRecorder, config: Config) {
    this._audioRecorder = audioRecorder;
    this._config = config;
  }

  /**
   * 現在接続しているボイスチャンネルを取得します。
   * @returns 現在のボイスチャンネル、またはnull
   */
  public getCurrentChannel(): VoiceChannel | null {
    return this._currentChannel;
  }

  /**
   * ボットがボイスチャンネルに自動参加すべきかチェックします。
   * @param channel チェックするボイスチャンネル
   * @returns 自動参加すべきであればtrue、そうでなければfalse
   */
  checkAutoJoin(channel: VoiceChannel): Promise<boolean> {
    if (this._connection) {
      return Promise.resolve(false); // 既にボイスチャンネルに接続済み
    }

    // チャンネルがボイスチャンネルかチェック
    if (channel.type !== ChannelType.GuildVoice) {
      return Promise.resolve(false);
    }

    // 許可されたカテゴリIDをチェック
    if (this._config.vc_summary.allowed_category_ids.length > 0 &&
        !this._config.vc_summary.allowed_category_ids.includes(channel.parentId || "")) {
      return Promise.resolve(false);
    }

    // 拒否されたチャンネルIDをチェック
    if (this._config.vc_summary.denied_channel_ids.includes(channel.id)) {
      return Promise.resolve(false);
    }

    const unmutedUsers = this.getUnmutedUsers(channel);
    return Promise.resolve(unmutedUsers.length >= this._config.vc_summary.min_users_to_join);
  }

  /**
   * ボットをボイスチャンネルに参加させます。
   * @param channel 参加するボイスチャンネル
   */
  async joinChannel(channel: VoiceChannel): Promise<void> {
    if (this._connection && this._connection.state.status !== VoiceConnectionStatus.Destroyed) {
      console.log(`既にボイスチャンネルに接続しています。まず現在のチャンネルを退出します。`);
      void this.leaveChannel(); // await this.leaveChannel() から変更
    }

    this._connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false, // ボットは音声を録音するためにデフンであってはなりません
    });

    this._currentChannel = channel;

    try {
      await entersState(this._connection, VoiceConnectionStatus.Ready, 30_000);
      console.log(`ボイスチャンネルに参加しました: ${channel.name}`);

      // 現在ミュートされていないすべてのユーザーの録音を開始
      this.getUnmutedUsers(channel).forEach(user => {
        const member = channel.guild.members.cache.get(user.id);
        if (member && !member.voice.mute && !member.user.bot) {
          this._audioRecorder.startRecording(user.id, this._connection!.receiver);
        }
      });

    } catch (error) {
      console.error(`ボイスチャンネル ${channel.name} への参加に失敗しました:`, error);
      throw error;
    }

    this._connection.on(VoiceConnectionStatus.Disconnected, (_oldState, newState) => {
      console.log(`ボイス接続が切断されました。理由: ${newState.reason}, ステータス: ${newState.status}`);
      void this.leaveChannel();
    });
  }

  /**
   * ボットを現在のボイスチャンネルから退出させます。
   * @returns なし
   */
  leaveChannel(): Promise<void> {
    if (this._connection) {
      // 退出前にすべての録音を停止
      this._currentChannel?.members.forEach(member => {
        if (!member.user.bot) {
          this._audioRecorder.stopRecording(member.id);
        }
      });
      this._connection.destroy();
      this._connection = null;
      this._currentChannel = null;
      console.log("ボイスチャンネルを退出しました。");
    }
    return Promise.resolve();
  }

  /**
   * 指定されたボイスチャンネル内のミュートされていないユーザーを取得します。
   * @param channel ボイスチャンネル
   * @returns ミュートされていないユーザーの配列
   */
  getUnmutedUsers(channel: VoiceChannel): User[] {
    return channel.members
      .filter(member => !member.voice.mute && !member.user.bot)
      .map(member => member.user);
  }

  /**
   * ユーザーがボイスチャンネルに参加した際の処理を行います。
   * @param member 参加したギルドメンバー
   * @param channel 参加したボイスチャンネル
   */
  onUserJoin(member: GuildMember, channel: VoiceChannel): void {
    if (this._currentChannel?.id === channel.id && !member.user.bot && !member.voice.mute) {
      console.log(`ユーザー ${member.user.tag} が参加し、ミュート解除されています。録音を開始します。`);
      this._audioRecorder.startRecording(member.id, this._connection!.receiver);
    }
  }

  /**
   * ユーザーがボイスチャンネルから退出した際の処理を行います。
   * @param member 退出したギルドメンバー
   * @param channel 退出したボイスチャンネル
   */
  async onUserLeave(member: GuildMember, channel: VoiceChannel): Promise<void> {
    if (this._currentChannel?.id === channel.id && !member.user.bot) {
      console.log(`ユーザー ${member.user.tag} が退出しました。録音を停止します。`);
      this._audioRecorder.stopRecording(member.id);

      // ボット以外のすべてのユーザーが退出したかチェック
      const remainingUsers = channel.members.filter(m => !m.user.bot && !m.voice.mute);
      if (remainingUsers.size === 0) {
        console.log("ボット以外のすべてのユーザーが退出しました。チャンネルを退出します。");
        await this.leaveChannel();
      }
    }
  }
}

interface VoiceManager {
  checkAutoJoin(channel: VoiceChannel): Promise<boolean>;
  joinChannel(channel: VoiceChannel): Promise<void>;
  leaveChannel(): Promise<void>;
  getUnmutedUsers(channel: VoiceChannel): User[];
  onUserJoin(member: GuildMember, channel: VoiceChannel): void;
  onUserLeave(member: GuildMember, channel: VoiceChannel): Promise<void>;
}