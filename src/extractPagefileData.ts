import * as esbuild from "esbuild";
import { Worker } from "node:worker_threads";

import { isDefined } from "./isDefined";
import { RawPagefileData } from "./isValidPagefile";

/**
 * Extracts metadata from a file at a given path. The metadata is used
 * throughout the rest of the plugin.
 *
 * This function is pretty whacky. As a high-level summary: it bundles a simple
 * script that extracts the metadata from the given file and runs that script in
 * a Worker thread.
 *
 *  1) Use esbuild.build() to bundle the entrypoint. The entrypoint is a script
 *  that imports the given file and reads out some metadata from the file.
 *  esbuild makes it possible to import TypeScript and JSX and execute it in a
 *  Worker environment. The entrypoint assumes it's running in a Worker and
 *  calls process.exit(0) on completion, regardless of error state.
 *
 *  2) Evaluate the entrypoint in a worker thread and resolve or reject based on
 *  how the worker executes. The worker thread makes it possible to sandbox the
 *  script's execution (as opposed to just using `eval`) to avoid issues of
 *  module side effects trashing the global scope.
 *
 *  I haven't benchmarked this function, but so far it seems fast enough?
 */
export async function extractPagefileData(
  root: string,
  path: string
): Promise<RawPagefileData> {
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
    throw new Error(`esbuild failed with errors at ${path}`);
  }

  const outputFile = bundleResult.outputFiles[0];

  if (!isDefined(outputFile)) {
    throw new Error(`esbuild built an empty result at ${path}`);
  }

  const workerSrc = outputFile.text;

  return new Promise((resolve, reject) => {
    const worker = new Worker(workerSrc, { eval: true });
    worker.once("message", (pageDataOrError: RawPagefileData | Error) => {
      if (pageDataOrError instanceof Error) {
        reject(pageDataOrError);
      } else {
        // TODO: Could validate the shape of pageDataOrError at this point
        resolve({ ...pageDataOrError, filePath: path });
      }
    });

    // Post an empty message to let the worker know we're ready
    worker.postMessage(void 0);
  });
}
