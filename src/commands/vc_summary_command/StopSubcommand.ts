import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { SubcommandInteraction } from "../base/command_base.js";
import { VcSummaryCommand } from "./VcSummaryCommand.js";

export class StopSubcommand extends SubcommandInteraction {
  command = new SlashCommandSubcommandBuilder()
    .setName("stop")
    .setDescription("VC要約botを手動で停止します。");

  constructor(registry: VcSummaryCommand) {
    super(registry);
  }

  async onCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply({ content: "VC要約botを停止します... (未実装)", ephemeral: true });
  }
}
