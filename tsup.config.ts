import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "es2022",
  external: ["@opencode/plugin"],
  clean: true,
  splitting: false,
  sourcemap: false,
  dts: {
    compilerOptions: {
      ignoreDeprecations: "6.0",
    },
  },
});
