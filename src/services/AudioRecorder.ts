import { AudioReceiveStream, EndBehaviorType, VoiceReceiver } from "@discordjs/voice";
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from "fs";
import { join } from "path";

/**
 * 音声セグメントのインターフェース
 */
interface AudioSegment {
  userId: string;
  startTime: Date;
  endTime: Date;
  audioBuffer: Buffer;
  transcription?: string;
}

/**
 * 音声録音とセグメント管理を行うクラス
 */
export class AudioRecorder {
  private readonly _audioBuffers: Map<string, Buffer[]> = new Map();
  private readonly _receiveStreams: Map<string, AudioReceiveStream> = new Map();
  private readonly _segmentTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly _segments: Map<string, AudioSegment[]> = new Map();
  private readonly _tempDir: string = join(process.cwd(), "temp_audio");

  /**
   * AudioRecorderのコンストラクタ
   * 一時音声ファイル保存ディレクトリを作成します。
   */
  constructor() {
    if (!existsSync(this._tempDir)) {
      mkdirSync(this._tempDir);
    }
  }

  /**
   * 指定されたユーザーの音声録音を開始します。
   * @param userId 録音を開始するユーザーのID
   * @param receiver ボイスレシーバー
   */
  startRecording(userId: string, receiver: VoiceReceiver): void {
    if (this._receiveStreams.has(userId)) {
      console.warn(`Recording already started for user ${userId}`);
      return;
    }

    this._audioBuffers.set(userId, []);
    this._segments.set(userId, []);

    const audioStream = receiver.subscribe(userId, { 
      end: { 
        behavior: EndBehaviorType.AfterSilence, 
        duration: 100 // 100ms of silence to end a segment
      }
    });
    this._receiveStreams.set(userId, audioStream);

    const outputPath = join(this._tempDir, `${userId}.pcm`);
    const outputStream = createWriteStream(outputPath);

    audioStream.pipe(outputStream);

    audioStream.on("data", (chunk: Buffer<ArrayBufferLike>) => {
      this._audioBuffers.get(userId)?.push(chunk);
      // Reset silence detection timer on data
      if (this._segmentTimers.has(userId)) {
        clearTimeout(this._segmentTimers.get(userId));
      }
      this._segmentTimers.set(userId, setTimeout(() => this._endSegment(userId), 500)); // End segment after 500ms of silence
    });

    audioStream.on("end", () => {
      console.log(`Audio stream ended for user ${userId}`);
      this._endSegment(userId);
      this._receiveStreams.delete(userId);
      if (existsSync(outputPath)) {
        unlinkSync(outputPath);
      }
    });

    audioStream.on("error", (error) => {
      console.error(`Audio stream error for user ${userId}:`, error);
      this._endSegment(userId);
      this._receiveStreams.delete(userId);
      if (existsSync(outputPath)) {
        unlinkSync(outputPath);
      }
    });

    console.log(`Started recording for user ${userId}`);
  }

  /**
   * 指定されたユーザーの音声録音を停止し、録音されたセグメントを返します。
   * @param userId 録音を停止するユーザーのID
   * @returns 録音された音声セグメントの配列
   */
  stopRecording(userId: string): AudioSegment[] {
    if (this._receiveStreams.has(userId)) {
      this._receiveStreams.get(userId)?.destroy();
      this._receiveStreams.delete(userId);
    }
    if (this._segmentTimers.has(userId)) {
      clearTimeout(this._segmentTimers.get(userId));
      this._segmentTimers.delete(userId);
    }
    this._endSegment(userId); // Ensure last segment is saved
    const userSegments = this._segments.get(userId) || [];
    this._segments.delete(userId);
    this._audioBuffers.delete(userId);
    console.log(`Stopped recording for user ${userId}`);
    return userSegments;
  }

  /**
   * 音声セグメントを終了し、バッファをクリアします。
   * @param userId セグメントを終了するユーザーのID
   */
  private _endSegment(userId: string): void {
    const buffers = this._audioBuffers.get(userId);
    if (buffers && buffers.length > 0) {
      const audioBuffer = Buffer.concat(buffers);
      const segment: AudioSegment = {
        userId,
        startTime: new Date(), // TODO: Actual start time
        endTime: new Date(),   // TODO: Actual end time
        audioBuffer,
      };
      this._segments.get(userId)?.push(segment);
      this._audioBuffers.set(userId, []); // Clear buffer for next segment
      console.log(`Segment ended for user ${userId}, buffer size: ${audioBuffer.length}`);
    }
  }

  /**
   * 無音を検出します。
   * @param _userId ユーザーID (未使用)
   * @returns 無音状態であればtrue、そうでなければfalse
   */
  detectSilence(_userId: string): boolean {
    // This is handled by EndBehaviorType.AfterSilence in subscribe options
    // and the _segmentTimers logic. This method might not be directly needed
    // or could be used to query the current silence state if exposed by @discordjs/voice.
    return false; // Placeholder
  }

  /**
   * 指定されたユーザーの音声セグメントを取得します。
   * @param userId セグメントを取得するユーザーのID
   * @returns 音声セグメントの配列
   */
  getSegments(userId: string): AudioSegment[] {
    return this._segments.get(userId) || [];
  }
}
