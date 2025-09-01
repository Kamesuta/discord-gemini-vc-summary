import assert from "assert";
import { parse } from "toml";
import { getWorkdirPath } from "./workdir.js";
import { copyFileSync, existsSync, readFileSync } from "fs";

/**
 * 設定ファイルの構造を定義するインターフェース
 */
export interface Config {
  /*
   * Configuration names should be written in snake_case. Therefore, we are disabling eslint naming rules here.
   * The 'requiresQuotes' rule is disabled here because it only excludes strings (including those with spaces) that need to be enclosed in quotes.
   */
  /* eslint-disable @typescript-eslint/naming-convention */

  /** サーバーIDの配列 */
  guild_ids: string[];

  /** VC要約機能に関する設定 */
  vc_summary: {
    /** ボットがVCに参加するために必要なミュートされていないユーザーの最小数 */
    min_users_to_join: number;
    /** ボットがVCに参加を許可されるカテゴリIDの配列 */
    allowed_category_ids: string[];
    /** ボットがVCに参加を拒否されるチャンネルIDの配列 */
    denied_channel_ids: string[];
    /** 定期要約を投稿する間隔（分） */
    summary_interval: number;
    /** 要約を投稿するテキストチャンネルのID */
    summary_channel_id: string;
  };
  /* eslint-enable @typescript-eslint/naming-convention */
}

// If config.toml does not exist, copy config.default.toml
if (!existsSync(getWorkdirPath("config.toml"))) {
  copyFileSync(
    getWorkdirPath("config.default.toml"),
    getWorkdirPath("config.toml"),
  );
}

/** Configuration */
export const config: Config = parse(
  readFileSync(getWorkdirPath("config.toml"), "utf-8"),
) as Config;

// Check the types
// basic type: config.some_text_setting && typeof config.some_text_setting === 'string'
// object type: config.some_object_setting && typeof config.some_object_setting === 'object'
// array type: config.some_array_setting && Array.isArray(config.some_array_setting)
assert(
  config.guild_ids && Array.isArray(config.guild_ids),
  "guild_ids is required.",
);
