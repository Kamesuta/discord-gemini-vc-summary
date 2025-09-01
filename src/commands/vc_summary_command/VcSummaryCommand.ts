import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { CommandGroupInteraction } from "../base/command_base.js";
import { StartSubcommand } from "./StartSubcommand.js";
import { StopSubcommand } from "./StopSubcommand.js";
import { StatusSubcommand } from "./StatusSubcommand.js";

export class VcSummaryCommand extends CommandGroupInteraction {
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

  async onCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    // This method will not be called directly for a command group.
    // Subcommands will handle the actual logic.
    throw new Error("Method not implemented.");
  }
}
