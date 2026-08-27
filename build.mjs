import * as esbuild from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";

const watch = process.argv.includes("--watch");
const outDir = "extension";

async function copyStaticAssets() {
  await mkdir(outDir, { recursive: true });
  await cp("src/manifest.json", `${outDir}/manifest.json`);
  await cp("src/icons", `${outDir}/icons`, { recursive: true });
  await cp("src/content/content.css", `${outDir}/content/content.css`);
}

const buildOptions = {
  entryPoints: [
    { in: "src/content/content.ts", out: "content/content" },
    { in: "src/background/service-worker.ts", out: "background/service-worker" },
  ],
  bundle: true,
  outdir: outDir,
  target: "chrome114",
  format: "iife",
  sourcemap: true,
  logLevel: "info",
};

await rm(outDir, { recursive: true, force: true });
await copyStaticAssets();

if (watch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log(`watching for changes, output in ${outDir}/`);
} else {
  await esbuild.build(buildOptions);
  console.log(`build complete, output in ${outDir}/`);
}
