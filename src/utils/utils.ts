import { logger } from "./log.js";

/**
 * スリープ関数
 * @param msec 待機時間（ミリ秒）
 * @returns Promise
 */
export const sleep = (msec: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, msec));

/**
 * 非同期関数ファンクタをvoidを返すファンクタに変換します。
 * 非同期関数の完了を待つ必要がない場合に便利です。
 * 戻り値は破棄され、エラーはログに記録されます。
 * @param func 非同期関数ファンクタ
 * @returns voidを返す非同期関数ファンクタ
 */
export function nowait<T extends (...args: never[]) => Promise<unknown>>(
  func: T,
): (...args: Parameters<T>) => void {
  return (...args) => {
    func(...args).catch((error) => {
      logger.error(error);
    });
  };
}
