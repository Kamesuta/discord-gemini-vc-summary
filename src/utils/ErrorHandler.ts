import { logger } from "./log.js";

export class ErrorHandler {
  handleDiscordError(error: Error, context: string): void {
    logger.error(`Discord API Error in ${context}:`, error);
    // Implement specific Discord API error handling (e.g., permission issues, rate limits)
  }

  handleGeminiError(error: Error, context: string): void {
    logger.error(`Gemini API Error in ${context}:`, error);
    // Implement specific Gemini API error handling (e.g., API key issues, rate limits)
    // Consider retry mechanism here or in the GeminiService itself
  }

  handleAudioError(error: Error, context: string): void {
    logger.error(`Audio Error in ${context}:`, error);
    // Implement specific audio error handling (e.g., device issues, file corruption)
  }

  handleConfigError(error: Error, context: string): void {
    logger.error(`Configuration Error in ${context}:`, error);
    // Implement specific config error handling (e.g., invalid values, missing files)
  }

  logError(error: Error, context: string): void {
    logger.error(`General Error in ${context}:`, error);
  }

  // Basic retry mechanism for API calls (can be expanded with exponential backoff)
  async retry<T>(fn: () => Promise<T>, retries: number = 3, delay: number = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        logger.warn(`Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retry(fn, retries - 1, delay * 2); // Exponential backoff
      } else {
        throw error;
      }
    }
  }
}
