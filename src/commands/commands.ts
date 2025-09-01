import { InteractionBase } from "./base/interaction_base.js";
import helloCommands from "./hello_command/commands.js";
import vcSummaryCommands from "./vc_summary_command/commands.js";

const commands: InteractionBase[] = [
  ...helloCommands,
  ...vcSummaryCommands,
  // Add other command group lists here
];

export default commands;
