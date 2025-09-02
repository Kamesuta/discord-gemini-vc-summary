# Discord VC 要約ボット（Gemini）

Google Gemini を用いて Discord のボイスチャットを要約する TypeScript 製ボットです。一定人数が参加中のVCに自動参加し、無音検出でユーザーごとにセグメント化しつつ録音します。定期要約の投稿と、新規参加者向けの「今北三行」メッセージも行います。

> 設計・要件は `.kiro/specs/discord-voice-summarizer` を参照しています。

## 機能

- 自動参加: ミュート解除ユーザー数が閾値以上のVCへ自動参加
- 録音/セグメント化: ユーザーごとに録音し、無音を検出して区切り
- 要約生成: Google Gemini API で会話を要約
- 定期投稿: 設定間隔ごとに要約を指定チャンネルへ投稿
- 今北三行: 新規参加者に向け現在の活動＋直近要約を要約して投稿（注意書き付き）
- コマンド登録: サーバー単位でのスラッシュコマンド登録

## 前提環境

- Node.js 22.x
- Discord Bot Token（`DISCORD_TOKEN`）
- Google Gemini API Key（`GEMINI_API_KEY`）
- Discord 権限: アプリコマンド、メッセージ送信、チャンネル閲覧、ボイス「接続」（必要に応じて「発言」）

## セットアップ

1. 依存関係をインストール
   ```bash
   npm install
   ```

2. 環境変数を設定
   - `.env.example` を `.env` にコピーし、値を設定
     ```env
     DISCORD_TOKEN=あなたのボットトークン
     GEMINI_API_KEY=あなたのGeminiAPIキー
     ```

3. 設定ファイルを用意
   - 初回起動時に `run/config.default.toml` が自動コピーされ `run/config.toml` が生成されます
   - もしくは `run/config.example.toml` を `run/config.toml` にコピーして編集
     ```toml
     guild_ids = ["あなたのサーバーID"]
     [vc_summary]
     min_users_to_join = 3
     allowed_category_ids = ["許可カテゴリID"]
     denied_channel_ids = []
     summary_interval = 5
     summary_channel_id = "要約投稿テキストチャンネルID"
     ```
   - `guild_ids` に登録したサーバーへ、ボットを招待しておいてください

4. 起動
   ```bash
   npm run start
   ```

## 使い方

- 自動動作
  - 参加条件を満たすVCに自動参加、録音/セグメント化を開始
  - `summary_interval` 分ごとに要約を `summary_channel_id` に投稿
  - 新規参加者検知で「今北三行」を投稿（末尾に「-# ※VCの音声は要約生成に使用されます」を付与）

- スラッシュコマンド
  - `/vc-summary start`（未実装のスタブ）
  - `/vc-summary stop`（未実装のスタブ）
  - `/vc-summary status`（未実装のスタブ）

## 設定項目の説明（`run/config.toml`）

- `guild_ids`: コマンドを登録するサーバーIDの配列
- `[vc_summary].min_users_to_join`: 自動参加に必要なミュート解除ユーザー最小人数
- `[vc_summary].allowed_category_ids`: 動作を許可するVCカテゴリID一覧（空なら全許可）
- `[vc_summary].denied_channel_ids`: 参加を拒否する特定VCチャンネルID一覧
- `[vc_summary].summary_interval`: 定期要約の間隔（分）。0以下で無効
- `[vc_summary].summary_channel_id`: 要約投稿先のテキストチャンネルID

補足:
- 作業ディレクトリは既定で `run`。`APP_BASEDIR` 環境変数で変更可能
- ログ出力は `run/bot.log`
- 一時音声は `temp_audio/` に保存（プロセス終了等でクリーンアップされる場合があります）

## トラブルシュート

- 起動時に「GEMINI_API_KEY が設定されていません」
  - `.env` の `GEMINI_API_KEY` を設定してください
- コマンドが表示されない
  - `run/config.toml` の `guild_ids` に対象サーバーのIDが含まれているか、ボットが該当サーバーに参加しているか確認
- 要約が投稿されない
  - `summary_interval` が 0 以下でないか、`summary_channel_id` が正しいか確認

## ライセンス

MIT License
