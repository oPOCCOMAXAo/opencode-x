import path from "path";
import process from "node:process";
import { type Plugin } from "@opencode/plugin";
import { type Info } from "@opencode/plugin/promise/tool";

export const root = ".opencode/plans";

function file(id: string) {
  return path.posix.join(root, `${id}.md`);
}

export const defaultPlanTarget = file("<session-id>");

export function planTarget({ id, directory }: { id: string; directory: string }) {
  const target = file(id);
  return path.resolve(directory, target);
}

export function editorConfig() {
  const variables = ["PLAN_VISUAL", "VISUAL", "EDITOR"].map((key) => {
    const value = process.env[key]?.trim() ?? "";
    return { key, value, set: Boolean(value) };
  });

  const selected = variables.find((entry) => entry.set) ?? null;

  return { variables, selected, command: selected?.value ?? "" };
}

export function editorCommand() {
  return editorConfig().command;
}

export function editorShell() {
  return process.env.SHELL ?? "sh";
}

export function formatSetting(value?: string) {
  return value ? `\`${value}\`` : "<unset>";
}

async function printConfig({ target }: { target: string }) {
  const editor = editorConfig();

  return [
    "# opencode-planner configuration",
    "## Planner files",
    `- Current session plan path: \`${target}\``,
    `- Default plan path pattern: \`${defaultPlanTarget}\``,
    "",
    "## Editor resolution",
    "- Precedence: `PLAN_VISUAL` -> `VISUAL` -> `EDITOR`",
    ...editor.variables.map((entry) => `- ${entry.key}: ${formatSetting(entry.value)}`),
    `- Selected source: ${editor.selected ? `\`${editor.selected.key}\`` : "none"}`,
    `- Selected command: ${formatSetting(editor.command)}`,
    "",
    "## Runtime flags",
    `- OPENCODE_EXPERIMENTAL: ${formatSetting(process.env.OPENCODE_EXPERIMENTAL?.trim() ?? "")}`,
    `- OPENCODE_EXPERIMENTAL_PLAN_MODE: ${formatSetting(process.env.OPENCODE_EXPERIMENTAL_PLAN_MODE?.trim() ?? "")}`,
    `- OPENCODE_CLIENT: ${formatSetting(process.env.OPENCODE_CLIENT?.trim() ?? "")}`,
  ].join("\n");
}

export function makeConfigTool(ctx: Plugin.Context): Info["execute"] {
  return async (_, context) => {
    const session = await ctx.session.get({ sessionID: context.sessionID });
    return {
      content: await printConfig({
        target: planTarget({ id: context.sessionID, directory: session.location.directory }),
      }),
    };
  };
}
