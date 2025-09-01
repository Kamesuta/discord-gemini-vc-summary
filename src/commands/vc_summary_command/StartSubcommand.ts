import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { SubcommandInteraction } from "../base/command_base.js";
import { VcSummaryCommand } from "./VcSummaryCommand.js";

export class StartSubcommand extends SubcommandInteraction {
  command = new SlashCommandSubcommandBuilder()
    .setName("start")
    .setDescription("VC要約botを手動で開始します。");

  constructor(registry: VcSummaryCommand) {
    super(registry);
  }

  async onCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply({ content: "VC要約botを開始します... (未実装)", ephemeral: true });
  }
}
