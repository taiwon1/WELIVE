import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts", "src/cli/bootstrap-admin.ts"],
  outDir: "dist",
  format: ["esm"],
  target: "node20",
  platform: "node",
  splitting: false,
  clean: true,
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});
