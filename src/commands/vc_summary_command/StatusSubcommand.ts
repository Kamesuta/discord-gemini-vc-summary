import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { SubcommandInteraction } from "../base/command_base.js";
import { VcSummaryCommand } from "./VcSummaryCommand.js";

/**
 * VC要約botの現在の状態を表示するサブコマンド
 */
export class StatusSubcommand extends SubcommandInteraction {
  /**
   * コマンド定義
   */
  command = new SlashCommandSubcommandBuilder()
    .setName("status")
    .setDescription("VC要約botの現在の状態を表示します。");

  /**
   * コンストラクタ
   * @param registry 親コマンドグループ
   */
  constructor(registry: VcSummaryCommand) {
    super(registry);
  }

  /**
   * コマンド実行処理
   * @param interaction コマンドインタラクション
   */
  async onCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply({ content: "VC要約botの現在の状態: (未実装)", ephemeral: true });
  }
}
