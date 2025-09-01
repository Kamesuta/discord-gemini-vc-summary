import { InteractionBase } from "./base/interaction_base.js";
import vcSummaryCommands from "./vc_summary_command/commands.js";

const commands: InteractionBase[] = [
  ...vcSummaryCommands,
  // Add other command group lists here
];

export default commands;
