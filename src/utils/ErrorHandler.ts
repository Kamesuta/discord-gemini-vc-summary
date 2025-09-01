import { logger } from "./log.js";

/**
 * エラーハンドリングとロギングを行うクラス
 */
export class ErrorHandler {
  /**
   * Discord API関連のエラーを処理します。
   * @param error エラーオブジェクト
   * @param context エラーが発生したコンテキスト
   */
  handleDiscordError(error: Error, context: string): void {
    logger.error(`Discord API Error in ${context}:`, error);
    // Implement specific Discord API error handling (e.g., permission issues, rate limits)
  }

  /**
   * Gemini API関連のエラーを処理します。
   * @param error エラーオブジェクト
   * @param context エラーが発生したコンテキスト
   */
  handleGeminiError(error: Error, context: string): void {
    logger.error(`Gemini API Error in ${context}:`, error);
    // Implement specific Gemini API error handling (e.g., API key issues, rate limits)
    // Consider retry mechanism here or in the GeminiService itself
  }

  /**
   * 音声関連のエラーを処理します。
   * @param error エラーオブジェクト
   * @param context エラーが発生したコンテキスト
   */
  handleAudioError(error: Error, context: string): void {
    logger.error(`Audio Error in ${context}:`, error);
    // Implement specific audio error handling (e.g., device issues, file corruption)
  }

  /**
   * 設定関連のエラーを処理します。
   * @param error エラーオブジェクト
   * @param context エラーが発生したコンテキスト
   */
  handleConfigError(error: Error, context: string): void {
    logger.error(`Configuration Error in ${context}:`, error);
    // Implement specific config error handling (e.g., invalid values, missing files)
  }

  /**
   * 一般的なエラーをログに記録します。
   * @param error エラーオブジェクト
   * @param context エラーが発生したコンテキスト
   */
  logError(error: Error, context: string): void {
    logger.error(`General Error in ${context}:`, error);
  }

  /**
   * 非同期処理をリトライします。
   * @param fn リトライする非同期関数
   * @param retries 残りのリトライ回数
   * @param delay リトライ間の遅延時間（ミリ秒）
   * @returns 非同期関数の結果
   */
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
