# 実装計画

- [ ] 1. プロジェクト基盤の設定とconfig拡張
  - 既存のconfig.tsを拡張してvc_summary設定を追加
  - package.jsonに必要な依存関係を追加（@discordjs/voice, @google/generative-ai等）
  - GatewayIntentBitsにGuildVoiceStatesを追加
  - _要件: 1.2, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 2. Gemini APIサービスの実装
  - [ ] 2.1 GeminiServiceクラスの作成
    - prototype-tool/src/transcribe.tsを参考にGeminiServiceクラスを実装
    - 音声の文字起こしと要約機能を統合
    - _要件: 3.1, 3.2_

  - [ ] 2.2 要約生成メソッドの実装
    - transcribeAndSummarize()メソッドで音声から要約を生成
    - generateWelcomeMessage()メソッドで「今北三行」メッセージを生成
    - updateCurrentActivity()メソッドで現在の活動状況を更新
    - _要件: 3.3, 4.2, 4.3_

- [ ] 3. メモリー管理システムの実装
  - [ ] 3.1 MemoryManagerクラスの作成
    - 短期・中期・長期メモリーのデータ構造を定義
    - ローリングウィンドウとLRUキャッシュの実装
    - _要件: 4.4, 4.5_

  - [ ] 3.2 メモリー操作メソッドの実装
    - addToShortTerm(), addToMediumTerm(), addToLongTerm()メソッド
    - getShortTermContext(), getMediumTermContext(), getLongTermContext()メソッド
    - getCurrentActivity()メソッドで現在の活動状況を取得
    - _要件: 4.4, 4.5_

- [ ] 4. 音声録音システムの実装
  - [ ] 4.1 AudioRecorderクラスの作成
    - ユーザーごとの音声録音機能を実装
    - 無音期間検出によるセグメント分割機能
    - _要件: 2.4, 2.7_

  - [ ] 4.2 音声セグメント管理の実装
    - AudioSegmentインターフェースの実装
    - startRecording(), stopRecording()メソッド
    - detectSilence(), getSegments()メソッド
    - _要件: 2.4, 2.7_

- [ ] 5. ボイスチャンネル管理システムの実装
  - [ ] 5.1 VoiceManagerクラスの作成
    - ボイスチャンネルの参加/退出ロジック
    - ユーザー監視とミュート状態の追跡
    - _要件: 2.1, 2.2, 2.3, 2.6_

  - [ ] 5.2 自動参加ロジックの実装
    - checkAutoJoin()メソッドで参加条件をチェック
    - 許可カテゴリと拒否チャンネルの検証
    - ミュートしていないユーザー数の監視
    - _要件: 2.1, 2.2, 2.3_

  - [ ] 5.3 ユーザーイベントハンドラーの実装
    - onUserJoin(), onUserLeave()メソッド
    - 全員退出時の自動退出機能
    - _要件: 2.5, 2.6_

- [ ] 6. 管理コマンドシステムの実装
  - [ ] 6.1 VcSummaryCommandクラスの作成
    - 既存のCommandGroupInteractionを継承
    - /vc-summaryコマンドグループの定義
    - _要件: 5.6, 5.7_

  - [ ] 6.2 サブコマンドの実装
    - StartSubcommand: 手動でbotを開始
    - StopSubcommand: 手動でbotを停止
    - StatusSubcommand: 現在の状態確認
    - _要件: 5.6, 5.7_

- [ ] 7. 定期要約システムの実装
  - [ ] 7.1 SummarySchedulerクラスの作成
    - 設定された間隔での定期要約投稿
    - タイマー管理とスケジューリング機能
    - _要件: 4.1, 5.5_

  - [ ] 7.2 要約投稿機能の実装
    - 要約チャンネルへの自動投稿
    - 短期・中期メモリーを活用した要約生成
    - _要件: 4.1, 4.6_

- [ ] 8. イベントハンドラーの統合
  - [ ] 8.1 ボイス状態変更イベントの実装
    - voiceStateUpdateイベントハンドラー
    - ユーザーの参加/退出/ミュート状態変更の処理
    - _要件: 2.1, 2.5, 2.6_

  - [ ] 8.2 新規参加者への「今北三行」機能
    - 新規参加者検出時の自動メッセージ投稿
    - 現在の活動状況と最近の要約を含むメッセージ生成
    - プライバシー注意書きの追加
    - _要件: 4.2, 4.3, 6.1_

- [ ] 9. エラーハンドリングとログ機能
  - [ ] 9.1 ErrorHandlerクラスの実装
    - Discord API、Gemini API、音声録音エラーの処理
    - 既存のloggerシステムを活用したエラーログ
    - _要件: 5.6, 5.7_

  - [ ] 9.2 リトライ機構の実装
    - Gemini API呼び出しの指数バックオフリトライ
    - Discord API呼び出しのレート制限対応
    - 音声録音の自動復旧機能
    - _要件: 5.6, 5.7_

- [ ] 10. メインアプリケーションの統合
  - [ ] 10.1 index.tsの拡張
    - 新しいイベントハンドラーの登録
    - VoiceManager、MemoryManager、SummarySchedulerの初期化
    - _要件: 1.1, 1.2_

  - [ ] 10.2 全コンポーネントの連携テスト
    - 各コンポーネント間の連携確認
    - 設定ファイルの読み込みテスト
    - エンドツーエンドの動作確認
    - _要件: 全要件_

- [ ] 11. 設定ファイルとドキュメントの作成
  - [ ] 11.1 config.default.tomlの更新
    - vc_summaryセクションの追加
    - サンプル設定値の記載
    - _要件: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 11.2 .env.exampleの更新
    - GEMINI_API_KEYの追加
    - 設定手順のコメント追加
    - _要件: 1.2_