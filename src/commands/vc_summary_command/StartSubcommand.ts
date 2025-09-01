import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { SubcommandInteraction } from "../base/command_base.js";
import { VcSummaryCommand } from "./VcSummaryCommand.js";

/**
 * VC要約botを手動で開始するサブコマンド
 */
export class StartSubcommand extends SubcommandInteraction {
  /**
   * コマンド定義
   */
  command = new SlashCommandSubcommandBuilder()
    .setName("start")
    .setDescription("VC要約botを手動で開始します。");

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
    await interaction.reply({ content: "VC要約botを開始します... (未実装)", ephemeral: true });
  }
}
