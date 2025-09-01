import { Client, TextChannel } from "discord.js";
import { Config } from "../utils/config.js";
import { GeminiServiceImpl } from "./GeminiService.js";
import { MemoryManager } from "./MemoryManager.js";
import { AudioRecorder } from "./AudioRecorder.js";
import { VoiceManagerImpl } from "./VoiceManager.js";

/**
 * 定期的にVCの要約を生成し、指定されたチャンネルに投稿するスケジューラー
 */
export class SummaryScheduler {
  private _client: Client;
  private _config: Config;
  private _geminiService: GeminiServiceImpl;
  private _memoryManager: MemoryManager;
  private _audioRecorder: AudioRecorder;
  private _voiceManager: VoiceManagerImpl;
  private _intervalId: NodeJS.Timeout | null = null;

  /**
   * SummarySchedulerのコンストラクタ
   * @param client Discordクライアント
   * @param config 設定情報
   * @param geminiService Gemini APIサービス
   * @param memoryManager メモリー管理サービス
   * @param audioRecorder 音声録音サービス
   * @param voiceManager ボイスチャンネル管理サービス
   */
  constructor(
    client: Client,
    config: Config,
    geminiService: GeminiServiceImpl,
    memoryManager: MemoryManager,
    audioRecorder: AudioRecorder,
    voiceManager: VoiceManagerImpl,
  ) {
    this._client = client;
    this._config = config;
    this._geminiService = geminiService;
    this._memoryManager = memoryManager;
    this._audioRecorder = audioRecorder;
    this._voiceManager = voiceManager;
  }

  /**
   * スケジューラーを開始します。
   * 設定された間隔で要約を生成し投稿します。
   */
  start(): void {
    if (this._intervalId) {
      console.log("Summary scheduler already running.");
      return;
    }

    const intervalMinutes = this._config.vc_summary.summary_interval;
    if (intervalMinutes <= 0) {
      console.warn("Summary interval is not set or is invalid. Skipping scheduler start.");
      return;
    }

    this._intervalId = setInterval(() => { void this._generateAndPostSummary(); }, intervalMinutes * 60 * 1000);
    console.log(`Summary scheduler started, posting every ${intervalMinutes} minutes.`);
  }

  /**
   * スケジューラーを停止します。
   */
  stop(): void {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
      console.log("Summary scheduler stopped.");
    }
  }

  /**
   * 要約を生成し、指定されたチャンネルに投稿します。
   * 短期メモリーのコンテキストがなければスキップします。
   */
  private async _generateAndPostSummary(): Promise<void> {
    console.log("Attempting to generate and post summary...");
    const shortTermContext = this._memoryManager.getShortTermContext();

    if (!shortTermContext) {
      console.log("No short-term context available for summary. Skipping.");
      return;
    }

    try {
      // For simplicity, using short-term context directly for now.
      // In a real scenario, you might process audio segments here.
      const summary = await this._geminiService.transcribeAndSummarize(Buffer.from(shortTermContext), this._memoryManager.getMediumTermContext());

      if (summary) {
        this._memoryManager.addToMediumTerm(summary, new Date());
        const summaryChannelId = this._config.vc_summary.summary_channel_id;
        const channel = await this._client.channels.fetch(summaryChannelId);

        if (channel && channel.isTextBased()) {
          await (channel as TextChannel).send(`**VC要約 (${new Date().toLocaleString()}):**\n${summary}`);
          console.log("Summary posted successfully.");
        } else {
          console.error(`Summary channel with ID ${summaryChannelId} not found or is not a text channel.`);
        }
      }
    } catch (error) {
      console.error("Error generating or posting summary:", error);
    }
  }
}
