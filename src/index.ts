import { Plugin } from "@opencode/plugin";
import { makeConfigTool } from "./config.js";
import { makeSubmitPlanTool, makeInitPlanTool } from "./plan.js";

export const PluginX = Plugin.define({
  id: "opencode-x",
  async setup(ctx) {
    await ctx.tool.transform((editor) => {
      editor.add({
        name: "submit_plan",
        description: "Open the current plan in the configured external editor for user",
        input: { type: "object", properties: {}, additionalProperties: false },
        execute: makeSubmitPlanTool(ctx),
      });
      editor.add({
        name: "init_plan",
        description: "Create the plan file for the current session",
        input: { type: "object", properties: {}, additionalProperties: false },
        execute: makeInitPlanTool(ctx),
      });
      editor.add({
        name: "x_config",
        description: "Show plugin configuration details for the current session",
        input: { type: "object", properties: {}, additionalProperties: false },
        execute: makeConfigTool(ctx),
      });
    });
  },
});

export default PluginX;
