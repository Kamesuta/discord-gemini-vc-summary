import log4js from "log4js";
import { getWorkdirPath } from "./workdir.js";

// ロガーを初期化
log4js.configure({
  appenders: {
    file: {
      type: "file",
      filename: getWorkdirPath("bot.log"),
    },
    console: {
      type: "console",
    },
  },
  categories: {
    default: {
      appenders: ["file", "console"],
      level: "info",
    },
  },
});

/** ログ出力用ロガー */
export const logger = log4js.getLogger("app");
