import { User } from "discord.js";
import { AudioReceiveStream, EndBehaviorType, VoiceReceiver } from "@discordjs/voice";
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from "fs";
import { join } from "path";

interface AudioSegment {
  userId: string;
  startTime: Date;
  endTime: Date;
  audioBuffer: Buffer;
  transcription?: string;
}

export class AudioRecorder {
  private readonly audioBuffers: Map<string, Buffer[]> = new Map();
  private readonly receiveStreams: Map<string, AudioReceiveStream> = new Map();
  private readonly segmentTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly segments: Map<string, AudioSegment[]> = new Map();
  private readonly tempDir: string = join(process.cwd(), "temp_audio");

  constructor() {
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir);
    }
  }

  startRecording(userId: string, receiver: VoiceReceiver): void {
    if (this.receiveStreams.has(userId)) {
      console.warn(`Recording already started for user ${userId}`);
      return;
    }

    this.audioBuffers.set(userId, []);
    this.segments.set(userId, []);

    const audioStream = receiver.subscribe(userId, { 
      end: { 
        behavior: EndBehaviorType.AfterSilence, 
        duration: 100 // 100ms of silence to end a segment
      }
    });
    this.receiveStreams.set(userId, audioStream);

    const outputPath = join(this.tempDir, `${userId}.pcm`);
    const outputStream = createWriteStream(outputPath);

    audioStream.pipe(outputStream);

    audioStream.on("data", (chunk) => {
      this.audioBuffers.get(userId)?.push(chunk);
      // Reset silence detection timer on data
      if (this.segmentTimers.has(userId)) {
        clearTimeout(this.segmentTimers.get(userId)!);
      }
      this.segmentTimers.set(userId, setTimeout(() => this.endSegment(userId), 500)); // End segment after 500ms of silence
    });

    audioStream.on("end", () => {
      console.log(`Audio stream ended for user ${userId}`);
      this.endSegment(userId);
      this.receiveStreams.delete(userId);
      if (existsSync(outputPath)) {
        unlinkSync(outputPath);
      }
    });

    audioStream.on("error", (error) => {
      console.error(`Audio stream error for user ${userId}:`, error);
      this.endSegment(userId);
      this.receiveStreams.delete(userId);
      if (existsSync(outputPath)) {
        unlinkSync(outputPath);
      }
    });

    console.log(`Started recording for user ${userId}`);
  }

  stopRecording(userId: string): AudioSegment[] {
    if (this.receiveStreams.has(userId)) {
      this.receiveStreams.get(userId)?.destroy();
      this.receiveStreams.delete(userId);
    }
    if (this.segmentTimers.has(userId)) {
      clearTimeout(this.segmentTimers.get(userId)!);
      this.segmentTimers.delete(userId);
    }
    this.endSegment(userId); // Ensure last segment is saved
    const userSegments = this.segments.get(userId) || [];
    this.segments.delete(userId);
    this.audioBuffers.delete(userId);
    console.log(`Stopped recording for user ${userId}`);
    return userSegments;
  }

  private endSegment(userId: string): void {
    const buffers = this.audioBuffers.get(userId);
    if (buffers && buffers.length > 0) {
      const audioBuffer = Buffer.concat(buffers);
      const segment: AudioSegment = {
        userId,
        startTime: new Date(), // TODO: Actual start time
        endTime: new Date(),   // TODO: Actual end time
        audioBuffer,
      };
      this.segments.get(userId)?.push(segment);
      this.audioBuffers.set(userId, []); // Clear buffer for next segment
      console.log(`Segment ended for user ${userId}, buffer size: ${audioBuffer.length}`);
    }
  }

  detectSilence(userId: string): boolean {
    // This is handled by EndBehaviorType.AfterSilence in subscribe options
    // and the segmentTimers logic. This method might not be directly needed
    // or could be used to query the current silence state if exposed by @discordjs/voice.
    return false; // Placeholder
  }

  getSegments(userId: string): AudioSegment[] {
    return this.segments.get(userId) || [];
  }
}
