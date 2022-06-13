import * as esbuild from "esbuild";
import { Worker } from "node:worker_threads";

import { expectDefinedOrThrow } from "./isDefined";
import { PagefileData } from "./types";

export async function extractPagefileData(
  root: string,
  path: string
): Promise<PagefileData> {
  const bundleResult = await esbuild.build({
    stdin: {
      contents: `

import { parentPort } from 'node:worker_threads';
import { exit } from 'node:process';

parentPort.once('message', async () => {
    try {
      const allExports = await import("${path}");
      parentPort.postMessage({
        meta: allExports.meta,
        exportNames: Object.keys(allExports),
        defaultExportDisplayName: allExports.default?.displayName ?? allExports.default?.name,
      });
    } catch (e) {
      parentPort.postMessage(e);
    } finally {
      exit(0);
    }
});

          `.trim(),
      sourcefile: "import-sandbox.js",
      loader: "ts",
      resolveDir: root,
    },
    platform: "node",
    format: "cjs",
    outdir: "none",
    metafile: true,
    write: false,
    bundle: true,
    logLevel: "silent",
  });

  if (bundleResult.errors.length > 0) {
    throw new Error(`esbuild failed with errors ${path}`);
  }

  expectDefinedOrThrow(
    bundleResult.outputFiles[0],
    new Error(`esbuild built an empty result ${path}`)
  );

  const src = bundleResult.outputFiles[0].text;

  return new Promise((resolve, reject) => {
    const worker = new Worker(src, { eval: true });
    worker.once("message", (pageDataOrError: any | Error) => {
      if (pageDataOrError instanceof Error) {
        reject(pageDataOrError);
      } else {
        resolve({ ...pageDataOrError, filePath: path });
      }
    });
    worker.postMessage(void 0);
  });
}
