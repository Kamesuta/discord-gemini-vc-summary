import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { SubcommandInteraction } from "../base/command_base.js";
import { VcSummaryCommand } from "./VcSummaryCommand.js";

export class StatusSubcommand extends SubcommandInteraction {
  command = new SlashCommandSubcommandBuilder()
    .setName("status")
    .setDescription("VC要約botの現在の状態を表示します。");

  constructor(registry: VcSummaryCommand) {
    super(registry);
  }

  async onCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply({ content: "VC要約botの現在の状態: (未実装)", ephemeral: true });
  }
}
