import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "path";
import process from "node:process";
import { spawn } from "node:child_process";
import { type Plugin } from "@opencode/plugin";
import { type Info } from "@opencode/plugin/promise/tool";
import { editorCommand, editorShell, planTarget } from "./config.js";

async function readIfExists(target: string) {
  try {
    return await readFile(target, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

function formatPlanBlock({
  title,
  content,
  fallback,
}: {
  title: string;
  content: string | null;
  fallback: string;
}) {
  return [title, "````markdown", content && content.trim() ? content : fallback, "````"].join("\n");
}

function runEditor({ target }: { target: string }) {
  const editor = editorCommand();
  if (!editor) {
    throw new Error(
      "None of `PLAN_VISUAL`, `VISUAL`, or `EDITOR` is set, so submit_plan cannot open the plan. Configure a blocking editor command such as `code --wait`, or a terminal launcher that opens your editor in a separate window and waits.",
    );
  }

  const shell = editorShell();

  return new Promise<void>((resolve: () => void, reject: (value: unknown) => void) => {
    const child = spawn(shell, ["-lc", `${editor} "$1"`, "opencode-editor", target], {
      stdio: ["ignore", "ignore", "pipe"],
      env: process.env,
    });

    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      const detail = stderr.trim();
      const suffix = detail ? `: ${detail}` : "";
      const status = code === null ? `signal ${signal}` : `status ${code}`;
      reject(
        new Error(
          `The external editor command exited with ${status}${suffix}. Configure PLAN_VISUAL, VISUAL, or EDITOR to launch a separate process that waits until editing is complete.`,
        ),
      );
    });
  });
}

export function makeSubmitPlanTool(ctx: Plugin.Context): Info["execute"] {
  return async (_, context) => {
    const session = await ctx.session.get({ sessionID: context.sessionID });
    const target = planTarget({ id: context.sessionID, directory: session.location.directory });
    return { content: await openPlan({ target }) };
  };
}

export async function openPlan({ target }: { target: string }): Promise<string | undefined> {
  const editor = editorCommand();
  if (!editor || editor == "mdlink") {
    return `Plan file: [plan](${target}), write it to user and stop. User must read it`;
  }

  const before = await readIfExists(target);
  await runEditor({ target });

  let after: string;

  try {
    after = await readFile(target, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      throw new Error(
        `The plan file \`${target}\` does not exist yet. Finish writing the plan first.`,
        { cause: error },
      );
    }

    throw error;
  }

  if (before === after) {
    return [
      "The plan was reopened in your external editor. No changes were made.",
      `File: ${target}`,
      "",
      formatPlanBlock({
        title: "## Current plan",
        content: after,
        fallback: `The plan file \`${target}\` is empty.`,
      }),
    ].join("\n");
  }

  return [
    "The user edited the plan externally.",
    `File: ${target}`,
    "",
    "Treat these external edits as review feedback on the plan. Summarize what changed, continue planning from the updated plan, and if this plan was already reviewed with submit_plan, submit the revised plan again before plan_exit.",
    "",
    formatPlanBlock({
      title: "## Previous plan",
      content: before,
      fallback: "_(The plan file did not exist before editing.)_",
    }),
    "",
    formatPlanBlock({
      title: "## Updated plan",
      content: after,
      fallback: `The plan file \`${target}\` is empty.`,
    }),
  ].join("\n");
}

export function makeInitPlanTool(ctx: Plugin.Context): Info["execute"] {
  return async (_, context) => {
    const session = await ctx.session.get({ sessionID: context.sessionID });
    const target = planTarget({ id: context.sessionID, directory: session.location.directory });
    return { content: await initPlan(target) };
  };
}

export async function initPlan(target: string) {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, "", { flag: "wx" });
  return `plan file created at ${target}`;
}
