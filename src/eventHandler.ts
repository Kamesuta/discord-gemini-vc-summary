import { Message, OmitPartialGroupDMChannel, VoiceState, ChannelType } from "discord.js";
import { VoiceManagerImpl } from "./services/VoiceManager.js";
import { MemoryManager } from "./services/MemoryManager.js";
import { GeminiServiceImpl } from "./services/GeminiService.js";
import { Config } from "./utils/config.js";

/**
 * ボットがメンションされた際に「Hello」と返信するサンプル関数
 * @param message ボットがメンションされたメッセージ
 */
export async function onMentionMessage(
  message: OmitPartialGroupDMChannel<Message>,
): Promise<void> {
  // ボットがメンションされたかチェック
  if (!message.mentions.has(message.client.user)) {
    return;
  }

  // ボットがメンションされたチャンネルに「Hello」と返信
  await message.channel.send(`Hello! ${message.author.username}!`);
}

/**
 * ボイスステートの更新イベントを処理します。
 * ユーザーのVC参加/退出、ミュート状態の変更などを検知し、
 * 必要に応じてボットのVC参加/退出、録音開始/停止、
 * 「今北三行」メッセージの送信などを行います。
 * @param oldState 変更前のボイスステート
 * @param newState 変更後のボイスステート
 * @param voiceManager ボイスチャンネル管理サービス
 * @param memoryManager メモリー管理サービス
 * @param geminiService Gemini APIサービス
 * @param config 設定情報
 */
export async function onVoiceStateUpdate(
  oldState: VoiceState,
  newState: VoiceState,
  voiceManager: VoiceManagerImpl,
  memoryManager: MemoryManager,
  geminiService: GeminiServiceImpl,
  config: Config,
): Promise<void> {
  // ユーザーがボイスチャンネルに参加
  if (!oldState.channelId && newState.channelId) {
    const newChannel = newState.channel;
    if (newChannel && newChannel.isVoiceBased() && newChannel.type === ChannelType.GuildVoice && newState.member) {
      console.log(`${newState.member.user.tag} joined voice channel ${newChannel.name}`);
      // 自動参加条件をチェック
      if (await voiceManager.checkAutoJoin(newChannel)) {
        await voiceManager.joinChannel(newChannel);
      }
      // 既に管理されているチャンネルに新しいユーザーが参加した場合の処理
      if (voiceManager.getCurrentChannel()?.id === newChannel.id) {
        void voiceManager.onUserJoin(newState.member, newChannel);
        // 「今北三行」メッセージを生成して送信
        const recentSummary = memoryManager.getMediumTermContext(); // またはより新しいものを取得
        const currentActivity = memoryManager.getCurrentActivity();
        const welcomeMessage = await geminiService.generateWelcomeMessage(currentActivity, recentSummary);
        const textChannel = newChannel.guild.channels.cache.get(config.vc_summary.summary_channel_id);
        if (textChannel && textChannel.isTextBased()) {
          await textChannel.send(`${newState.member.user.tag}さん、ようこそ！\n${welcomeMessage}`);
        }
      }
    }
  }
  // ユーザーがボイスチャンネルから退出
  else if (oldState.channelId && !newState.channelId) {
    const oldChannel = oldState.channel;
    if (oldChannel && oldChannel.isVoiceBased() && oldChannel.type === ChannelType.GuildVoice && oldState.member) {
      console.log(`${oldState.member.user.tag} left voice channel ${oldChannel.name}`);
      if (voiceManager.getCurrentChannel()?.id === oldChannel.id) {
        void voiceManager.onUserLeave(oldState.member, oldChannel);
      }
    }
  }
  // ユーザーがチャンネルを移動したか、ミュート/デフ状態を変更
  else if (oldState.channelId && newState.channelId && oldState.channelId === newState.channelId) {
    // ミュート/デフ状態の変更
    if (oldState.selfMute !== newState.selfMute || oldState.serverMute !== newState.serverMute) {
      const channel = newState.channel;
      if (channel && channel.isVoiceBased() && channel.type === ChannelType.GuildVoice && newState.member) {
        if (voiceManager.getCurrentChannel()?.id === channel.id) {
          if (newState.member.voice.mute && !oldState.member?.voice.mute) {
            console.log(`${newState.member.user.tag} muted themselves.`);
            void voiceManager.onUserLeave(newState.member, channel); // 録音目的で退出として扱う
          } else if (!newState.member.voice.mute && oldState.member?.voice.mute) {
            console.log(`${newState.member.user.tag} unmuted themselves.`);
            void voiceManager.onUserJoin(newState.member, channel); // 録音目的で参加として扱う
          }
        }
      }
    }
  }
}
