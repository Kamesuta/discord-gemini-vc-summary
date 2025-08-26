import "dotenv/config"; // .envファイルを読み込む
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import * as fs from "fs";

// APIキーを環境変数から取得
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("エラー: 環境変数 GEMINI_API_KEY が設定されていません。");
  process.exit(1);
}

// Geminiクライアントを初期化
const genAI = new GoogleGenerativeAI(API_KEY);

// ファイルパスをコマンドライン引数から取得
const audioFilePath = process.argv[2];
if (!audioFilePath) {
  console.error("使用法: ts-node src/transcribe.ts <audio_file_path>");
  process.exit(1);
}

// 音声ファイルをBase64に変換するヘルパー関数
function fileToGenerativePart(path: string, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

async function run() {
  try {
    // ファイルの存在チェック
    if (!fs.existsSync(audioFilePath)) {
      console.error(`エラー: ファイルが見つかりません - ${audioFilePath}`);
      process.exit(1);
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      // https://ai.google.dev/gemini-api/docs/safety-settings
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

    // MimeTypeをMP3に変更
    const audioFile = fileToGenerativePart(audioFilePath, "audio/mp3");

    const prompt = "この音声ファイルの内容を文字起こししてください。";

    const result = await model.generateContent([prompt, audioFile]);
    const response = result.response;
    const text = response.text();

    console.log("Gemini APIによる文字起こし結果:");
    console.log(text);

  } catch (error) {
    console.error("文字起こし中にエラーが発生しました:", error);
    process.exit(1);
  }
}

run();
