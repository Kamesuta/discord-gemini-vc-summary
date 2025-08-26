# Gemini API 文字起こしプロトタイプ 仕様書

## 1. 概要
本ツールは、GoogleのGemini APIを利用して音声データの文字起こしが可能かどうかを検証することを目的とする。
Discord VCの音声要約ボット開発の実現可能性調査(PoC)の一環として作成する。

## 2. 機能要件
- 指定された音声ファイルを読み込むことができる。
- 読み込んだ音声データをGemini APIに送信し、文字起こしをリクエストする。
- Gemini APIからのレスポンスを受け取り、文字起こしされたテキストを標準出力に表示する。
- エラーが発生した場合は、エラー内容がわかるように表示する。

## 3. 非機能要件
- **実行環境:** Node.jsとTypeScriptがインストールされているコマンドライン環境。
- **APIキー管理:** Gemini APIのAPIキーは、環境変数 `GEMINI_API_KEY` から読み込むこととし、コード内に直接記述しない。
- **対応音声フォーマット:** まずは `WAV` 形式に対応する。将来的には `MP3` や `FLAC` なども検討する。

## 4. CLI仕様
### コマンド
```bash
ts-node src/transcribe.ts <audio_file_path>
```

### 引数
- `<audio_file_path>`: (必須) 文字起こし対象の音声ファイルのパスを指定する。

### 実行例
```bash
# APIキーを環境変数に設定
export GEMINI_API_KEY="YOUR_API_KEY"

# ツールを実行
ts-node src/transcribe.ts "path/to/your/audio.wav"

# 実行結果 (標準出力)
> Gemini APIによる文字起こし結果:
> こんにちは、これはテストです。
```
