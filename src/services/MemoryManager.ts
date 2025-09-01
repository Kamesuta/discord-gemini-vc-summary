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
  private shortTermMemory: ShortTermMemory = { conversations: [], maxAge: 5 };
  private mediumTermMemory: MediumTermMemory = { summaries: [], maxAge: 60 };
  private longTermMemory: LongTermMemory = { activities: [], maxEntries: 100 };
  private currentActivity: string = "";

  addToShortTerm(content: string, timestamp: Date): void {
    this.shortTermMemory.conversations.push({ content, timestamp, type: 'conversation' });
    this.cleanUpShortTermMemory();
  }

  addToMediumTerm(summary: string, timestamp: Date): void {
    this.mediumTermMemory.summaries.push({ content: summary, timestamp, type: 'summary' });
    this.cleanUpMediumTermMemory();
  }

  addToLongTerm(context: string, timestamp: Date): void {
    this.longTermMemory.activities.push({ content: context, timestamp, type: 'context' });
    if (this.longTermMemory.activities.length > this.longTermMemory.maxEntries) {
      this.longTermMemory.activities.shift(); // Remove the oldest entry
    }
  }

  getShortTermContext(): string {
    this.cleanUpShortTermMemory();
    return this.shortTermMemory.conversations.map(entry => entry.content).join("\n");
  }

  getMediumTermContext(): string {
    this.cleanUpMediumTermMemory();
    return this.mediumTermMemory.summaries.map(entry => entry.content).join("\n");
  }

  getLongTermContext(): string {
    return this.longTermMemory.activities.map(entry => entry.content).join("\n");
  }

  getCurrentActivity(): string {
    return this.currentActivity;
  }

  setCurrentActivity(activity: string): void {
    this.currentActivity = activity;
  }

  private cleanUpShortTermMemory(): void {
    const now = new Date();
    this.shortTermMemory.conversations = this.shortTermMemory.conversations.filter(
      entry => (now.getTime() - entry.timestamp.getTime()) / (1000 * 60) < this.shortTermMemory.maxAge
    );
  }

  private cleanUpMediumTermMemory(): void {
    const now = new Date();
    this.mediumTermMemory.summaries = this.mediumTermMemory.summaries.filter(
      entry => (now.getTime() - entry.timestamp.getTime()) / (1000 * 60) < this.mediumTermMemory.maxAge
    );
  }
}
