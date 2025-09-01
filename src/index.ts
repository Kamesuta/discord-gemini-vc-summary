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
 * Discord Client
 */
export const client: Client = new Client({
  // Specify the Gateway Intents used by the bot
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates],
});

// Initialize services
const errorHandler = new ErrorHandler();
const geminiService = new GeminiServiceImpl();
const memoryManager = new MemoryManager();
const audioRecorder = new AudioRecorder();
const voiceManager = new VoiceManagerImpl(audioRecorder, config);
const summaryScheduler = new SummaryScheduler(client, config, geminiService, memoryManager, audioRecorder, voiceManager);

/**
 * Command Handler
 */
const commandHandler = new CommandHandler(commands);

// Register interaction handlers
client.on(
  Events.ClientReady,
  nowait(async () => {
    logger.info(`Logged in as ${client.user?.username ?? "Unknown"}!`);

    // Register commands
    await commandHandler.registerCommands();

    // Start summary scheduler
    summaryScheduler.start();

    logger.info(`Interaction registration completed`);
  }),
);
client.on(
  Events.InteractionCreate,
  nowait(commandHandler.onInteractionCreate.bind(commandHandler)),
);

// Event handler sample: Respond with "Hello" when mentioned
client.on(Events.MessageCreate, nowait(onMentionMessage));

// Voice state update event handler
client.on(
  Events.VoiceStateUpdate,
  nowait(async (oldState: VoiceState, newState: VoiceState) => {
    await onVoiceStateUpdate(oldState, newState, voiceManager, memoryManager, geminiService, config);
  }),
);

// Log in to Discord
await client.login(process.env.DISCORD_TOKEN);
