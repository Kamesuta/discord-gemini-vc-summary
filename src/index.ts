import { logger } from "./utils/log.js";
import { nowait } from "./utils/utils.js";
import { Client, Events, GatewayIntentBits, VoiceState } from "discord.js";
import CommandHandler from "./commands/CommandHandler.js";
import commands from "./commands/commands.js";
import { onMentionMessage, onVoiceStateUpdate } from "./eventHandler.js";
import { config } from "./utils/config.js";
import { GeminiServiceImpl } from "./services/GeminiService.js";
import { MemoryManager } from "./services/MemoryManager.js";
import { AudioRecorder } from "./services/AudioRecorder.js";
import { VoiceManagerImpl } from "./services/VoiceManager.js";
import { SummaryScheduler } from "./services/SummaryScheduler.js";
import { ErrorHandler } from "./utils/ErrorHandler.js";

/**
 * Discordクライアント
 */
export const client: Client = new Client({
  // ボットが使用するゲートウェイインテントを指定
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates],
});

// サービスを初期化
const _errorHandler = new ErrorHandler();
const geminiService = new GeminiServiceImpl();
const memoryManager = new MemoryManager();
const audioRecorder = new AudioRecorder();
const voiceManager = new VoiceManagerImpl(audioRecorder, config);
const summaryScheduler = new SummaryScheduler(client, config, geminiService, memoryManager, audioRecorder, voiceManager);

/**
 * コマンドハンドラー
 */
const commandHandler = new CommandHandler(commands);

// インタラクションハンドラーを登録
client.on(
  Events.ClientReady,
  nowait(async () => {
    logger.info(`ログインしました: ${client.user?.username ?? "不明"}!`);

    // コマンドを登録
    await commandHandler.registerCommands();

    // 要約スケジューラーを開始
    summaryScheduler.start();

    logger.info(`インタラクションの登録が完了しました`);
  }),
);
client.on(
  Events.InteractionCreate,
  nowait(commandHandler.onInteractionCreate.bind(commandHandler)),
);

// イベントハンドラーの例: メンションされたら「Hello」と返信
client.on(Events.MessageCreate, nowait(onMentionMessage));

// ボイスステート更新イベントハンドラー
client.on(
  Events.VoiceStateUpdate,
  nowait(async (oldState: VoiceState, newState: VoiceState) => {
    await onVoiceStateUpdate(oldState, newState, voiceManager, memoryManager, geminiService, config);
  }),
);

// Discordにログイン
await client.login(process.env.DISCORD_TOKEN);
