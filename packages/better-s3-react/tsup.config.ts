import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "esnext",
  dts: false,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: true,
  outDir: "dist",
  skipNodeModulesBundle: true,
  external: [/^[^./]/],
  banner: { js: '"use client";' },
});
