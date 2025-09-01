import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// APIキーを環境変数から取得
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("エラー: 環境変数 GEMINI_API_KEY が設定されていません。");
}

// Geminiクライアントを初期化
const genAI = new GoogleGenerativeAI(API_KEY);

// BufferをGenerativePartに変換するヘルパー関数
function bufferToGenerativePart(buffer: Buffer, mimeType: string) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}

interface GeminiService {
  transcribeAndSummarize(audioBuffer: Buffer, context: string): Promise<string>;
  generateWelcomeMessage(currentActivity: string, recentSummary: string): Promise<string>;
  updateCurrentActivity(transcription: string, previousActivity: string): Promise<string>;
}

export class GeminiServiceImpl implements GeminiService {
  private readonly model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });

  async transcribeAndSummarize(audioBuffer: Buffer, context: string): Promise<string> {
    try {
      const audioFile = bufferToGenerativePart(audioBuffer, "audio/mp3");

      const prompt = `
      この音声ファイルはDiscordのVCで話されている会話です。
      話されているトピックをわかりやすく5行程度に要約し、要約結果"のみ"を出力してください。

      ・Discordの要約チャンネルで表示するため、ポップでユーザーが馴染みやすい文にしてください。
      ・「- 」で箇条書きが書けます。
      ${context ? `
これまでの会話の文脈:
${context}` : ""}
      `;

      const result = await this.model.generateContent([prompt, audioFile]);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("要約中にエラーが発生しました:", error);
      throw error;
    }
  }

  async generateWelcomeMessage(currentActivity: string, recentSummary: string): Promise<string> {
    const prompt = `
    DiscordのVCに新しく参加したユーザー向けのウェルカムメッセージを作成してください。
    現在の活動内容と最近の要約を基に、3行程度で簡潔にまとめてください。
    最後に「-# ※VCの音声は要約生成に使用されます」という注意書きを必ず含めてください。

    現在の活動内容: ${currentActivity}
    最近の要約: ${recentSummary}
    `;
    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  async updateCurrentActivity(transcription: string, previousActivity: string): Promise<string> {
    const prompt = `
    以下の会話の文字起こしと前回の活動内容を基に、現在の活動内容を更新してください。
    活動内容は「〇〇について話しています」のように簡潔にまとめてください。

    会話の文字起こし: ${transcription}
    前回の活動内容: ${previousActivity}
    `;
    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }
}
