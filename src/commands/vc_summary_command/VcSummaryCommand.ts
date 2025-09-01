import { SlashCommandBuilder } from "discord.js";
import { CommandGroupInteraction } from "../base/command_base.js";

/**
 * VC要約botの管理コマンドグループ
 */
export class VcSummaryCommand extends CommandGroupInteraction {
  /**
   * コマンド定義
   */
  command = new SlashCommandBuilder()
    .setName("vc-summary")
    .setDescription("VC要約botの管理")
    .addSubcommand(subcommand =>
      subcommand
        .setName("start")
        .setDescription("VC要約botを手動で開始します。")
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("stop")
        .setDescription("VC要約botを手動で停止します。")
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("status")
        .setDescription("VC要約botの現在の状態を表示します。")
    );
}
