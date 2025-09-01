import { InteractionBase } from "../base/interaction_base.js";
import { VcSummaryCommand } from "./VcSummaryCommand.js";
import { StartSubcommand } from "./StartSubcommand.js";
import { StopSubcommand } from "./StopSubcommand.js";
import { StatusSubcommand } from "./StatusSubcommand.js";

const vcSummaryCommandInstance = new VcSummaryCommand();

const vcSummaryCommands: InteractionBase[] = [
  vcSummaryCommandInstance,
  new StartSubcommand(vcSummaryCommandInstance),
  new StopSubcommand(vcSummaryCommandInstance),
  new StatusSubcommand(vcSummaryCommandInstance),
];

export default vcSummaryCommands;
