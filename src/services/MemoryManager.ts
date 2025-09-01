/**
 * メモリーエントリのインターフェース
 */
interface MemoryEntry {
  content: string;
  timestamp: Date;
  type: 'conversation' | 'summary' | 'context';
}

/**
 * 短期メモリーのインターフェース
 */
interface ShortTermMemory {
  conversations: MemoryEntry[];
  maxAge: number; // minutes
}

/**
 * 中期メモリーのインターフェース
 */
interface MediumTermMemory {
  summaries: MemoryEntry[];
  maxAge: number; // minutes
}

/**
 * 長期メモリーのインターフェース
 */
interface LongTermMemory {
  activities: MemoryEntry[];
  maxEntries: number;
}

/**
 * 短期、中期、長期メモリーを管理するクラス
 */
export class MemoryManager {
  private _shortTermMemory: ShortTermMemory = { conversations: [], maxAge: 5 };
  private _mediumTermMemory: MediumTermMemory = { summaries: [], maxAge: 60 };
  private _longTermMemory: LongTermMemory = { activities: [], maxEntries: 100 };
  private _currentActivity: string = "";

  /**
   * 短期メモリーにコンテンツを追加します。
   * @param content 追加するコンテンツ
   * @param timestamp コンテンツのタイムスタンプ
   */
  addToShortTerm(content: string, timestamp: Date): void {
    this._shortTermMemory.conversations.push({ content, timestamp, type: 'conversation' });
    this._cleanUpShortTermMemory();
  }

  /**
   * 中期メモリーに要約を追加します。
   * @param summary 追加する要約
   * @param timestamp 要約のタイムスタンプ
   */
  addToMediumTerm(summary: string, timestamp: Date): void {
    this._mediumTermMemory.summaries.push({ content: summary, timestamp, type: 'summary' });
    this._cleanUpMediumTermMemory();
  }

  /**
   * 長期メモリーにコンテキストを追加します。
   * @param context 追加するコンテキスト
   * @param timestamp コンテキストのタイムスタンプ
   */
  addToLongTerm(context: string, timestamp: Date): void {
    this._longTermMemory.activities.push({ content: context, timestamp, type: 'context' });
    if (this._longTermMemory.activities.length > this._longTermMemory.maxEntries) {
      this._longTermMemory.activities.shift(); // Remove the oldest entry
    }
  }

  /**
   * 短期メモリーのコンテキストを取得します。
   * @returns 短期メモリーのコンテキスト文字列
   */
  getShortTermContext(): string {
    this._cleanUpShortTermMemory();
    return this._shortTermMemory.conversations.map(entry => entry.content).join("\n");
  }

  /**
   * 中期メモリーのコンテキストを取得します。
   * @returns 中期メモリーのコンテキスト文字列
   */
  getMediumTermContext(): string {
    this._cleanUpMediumTermMemory();
    return this._mediumTermMemory.summaries.map(entry => entry.content).join("\n");
  }

  /**
   * 長期メモリーのコンテキストを取得します。
   * @returns 長期メモリーのコンテキスト文字列
   */
  getLongTermContext(): string {
    return this._longTermMemory.activities.map(entry => entry.content).join("\n");
  }

  /**
   * 現在の活動内容を取得します。
   * @returns 現在の活動内容文字列
   */
  getCurrentActivity(): string {
    return this._currentActivity;
  }

  /**
   * 現在の活動内容を設定します。
   * @param activity 設定する活動内容
   */
  setCurrentActivity(activity: string): void {
    this._currentActivity = activity;
  }

  /**
   * 短期メモリーをクリーンアップします。
   * 古いエントリを削除します。
   */
  private _cleanUpShortTermMemory(): void {
    const now = new Date();
    this._shortTermMemory.conversations = this._shortTermMemory.conversations.filter(
      entry => (now.getTime() - entry.timestamp.getTime()) / (1000 * 60) < this._shortTermMemory.maxAge
    );
  }

  /**
   * 中期メモリーをクリーンアップします。
   * 古いエントリを削除します。
   */
  private _cleanUpMediumTermMemory(): void {
    const now = new Date();
    this._mediumTermMemory.summaries = this._mediumTermMemory.summaries.filter(
      entry => (now.getTime() - entry.timestamp.getTime()) / (1000 * 60) < this._mediumTermMemory.maxAge
    );
  }
}

