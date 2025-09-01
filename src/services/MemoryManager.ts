interface MemoryEntry {
  content: string;
  timestamp: Date;
  type: 'conversation' | 'summary' | 'context';
}

interface ShortTermMemory {
  conversations: MemoryEntry[];
  maxAge: number; // minutes
}

interface MediumTermMemory {
  summaries: MemoryEntry[];
  maxAge: number; // minutes
}

interface LongTermMemory {
  activities: MemoryEntry[];
  maxEntries: number;
}

export class MemoryManager {
  private _shortTermMemory: ShortTermMemory = { conversations: [], maxAge: 5 };
  private _mediumTermMemory: MediumTermMemory = { summaries: [], maxAge: 60 };
  private _longTermMemory: LongTermMemory = { activities: [], maxEntries: 100 };
  private _currentActivity: string = "";

  addToShortTerm(content: string, timestamp: Date): void {
    this._shortTermMemory.conversations.push({ content, timestamp, type: 'conversation' });
    this._cleanUpShortTermMemory();
  }

  addToMediumTerm(summary: string, timestamp: Date): void {
    this._mediumTermMemory.summaries.push({ content: summary, timestamp, type: 'summary' });
    this._cleanUpMediumTermMemory();
  }

  addToLongTerm(context: string, timestamp: Date): void {
    this._longTermMemory.activities.push({ content: context, timestamp, type: 'context' });
    if (this._longTermMemory.activities.length > this._longTermMemory.maxEntries) {
      this._longTermMemory.activities.shift(); // Remove the oldest entry
    }
  }

  getShortTermContext(): string {
    this._cleanUpShortTermMemory();
    return this._shortTermMemory.conversations.map(entry => entry.content).join("\n");
  }

  getMediumTermContext(): string {
    this._cleanUpMediumTermMemory();
    return this._mediumTermMemory.summaries.map(entry => entry.content).join("\n");
  }

  getLongTermContext(): string {
    return this._longTermMemory.activities.map(entry => entry.content).join("\n");
  }

  getCurrentActivity(): string {
    return this._currentActivity;
  }

  setCurrentActivity(activity: string): void {
    this._currentActivity = activity;
  }

  private _cleanUpShortTermMemory(): void {
    const now = new Date();
    this._shortTermMemory.conversations = this._shortTermMemory.conversations.filter(
      entry => (now.getTime() - entry.timestamp.getTime()) / (1000 * 60) < this._shortTermMemory.maxAge
    );
  }

  private _cleanUpMediumTermMemory(): void {
    const now = new Date();
    this._mediumTermMemory.summaries = this._mediumTermMemory.summaries.filter(
      entry => (now.getTime() - entry.timestamp.getTime()) / (1000 * 60) < this._mediumTermMemory.maxAge
    );
  }
}
