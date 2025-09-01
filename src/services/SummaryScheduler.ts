import { Client, TextChannel } from "discord.js";
import { Config } from "../utils/config.js";
import { GeminiServiceImpl } from "./GeminiService.js";
import { MemoryManager } from "./MemoryManager.js";
import { AudioRecorder } from "./AudioRecorder.js";
import { VoiceManagerImpl } from "./VoiceManager.js";

export class SummaryScheduler {
  private client: Client;
  private config: Config;
  private geminiService: GeminiServiceImpl;
  private memoryManager: MemoryManager;
  private audioRecorder: AudioRecorder;
  private voiceManager: VoiceManagerImpl;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    client: Client,
    config: Config,
    geminiService: GeminiServiceImpl,
    memoryManager: MemoryManager,
    audioRecorder: AudioRecorder,
    voiceManager: VoiceManagerImpl,
  ) {
    this.client = client;
    this.config = config;
    this.geminiService = geminiService;
    this.memoryManager = memoryManager;
    this.audioRecorder = audioRecorder;
    this.voiceManager = voiceManager;
  }

  start(): void {
    if (this.intervalId) {
      console.log("Summary scheduler already running.");
      return;
    }

    const intervalMinutes = this.config.vc_summary.summary_interval;
    if (intervalMinutes <= 0) {
      console.warn("Summary interval is not set or is invalid. Skipping scheduler start.");
      return;
    }

    this.intervalId = setInterval(() => this.generateAndPostSummary(), intervalMinutes * 60 * 1000);
    console.log(`Summary scheduler started, posting every ${intervalMinutes} minutes.`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Summary scheduler stopped.");
    }
  }

  private async generateAndPostSummary(): Promise<void> {
    console.log("Attempting to generate and post summary...");
    const shortTermContext = this.memoryManager.getShortTermContext();

    if (!shortTermContext) {
      console.log("No short-term context available for summary. Skipping.");
      return;
    }

    try {
      // For simplicity, using short-term context directly for now.
      // In a real scenario, you might process audio segments here.
      const summary = await this.geminiService.transcribeAndSummarize(Buffer.from(shortTermContext), this.memoryManager.getMediumTermContext());

      if (summary) {
        this.memoryManager.addToMediumTerm(summary, new Date());
        const summaryChannelId = this.config.vc_summary.summary_channel_id;
        const channel = await this.client.channels.fetch(summaryChannelId);

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
