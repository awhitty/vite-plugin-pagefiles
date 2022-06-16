import * as esbuild from "esbuild";
import { BuildOptions, Plugin, PluginBuild, StdinOptions } from "esbuild";
import { Worker } from "node:worker_threads";

import { isDefined } from "./isDefined";
import { PagefileMeta } from "./types";

export interface RawPagefileData {
  filePath: string;
  exports: string[];
  meta?: PagefileMeta;
}

function createEsbuildStdin(root: string, contents: string): StdinOptions {
  return {
    contents: contents,
    sourcefile: "import-sandbox.js",
    loader: "ts",
    resolveDir: root,
  };
}

function sideEffectsOverridePlugin(): Plugin {
  return {
    name: "side-effects-override",
    setup(build: PluginBuild) {
      build.onResolve({ filter: /^\?skipresolve/ }, async (args) => {
        const result = await build.resolve(args.path + "?skipresolve");
        return { ...result, sideEffects: false };
      });
    },
  };
}

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
 *  calls process.exit(0) on completion.
 *
 *  2) Use esbuild.build() again on the file directly. This time bundle as esm
 *  to statically extract the exports from the file from the metafile in the
 *  bundle result.
 *
 *  3) Evaluate the entrypoint in a worker thread and resolve or reject based on
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
  const esbuildSharedOptions: Partial<BuildOptions> = {
    platform: "node",
    format: "cjs",
    outdir: "none",
    write: false,
    bundle: true,
    logLevel: "silent",
    plugins: [sideEffectsOverridePlugin()],
  };

  const runtimeBundle = await esbuild.build({
    ...esbuildSharedOptions,
    stdin: createEsbuildStdin(
      root,
      `

import { parentPort } from 'node:worker_threads';
import { exit } from 'node:process';

import { Meta } from "${path}";

parentPort.once('message', async () => {
  parentPort.postMessage({ meta: Meta() });
  exit(0);
});

      `.trim()
    ),
  });

  const staticBundle = await esbuild.build({
    ...esbuildSharedOptions,
    metafile: true,
    format: "esm",
    entryPoints: [path],
  });

  if (runtimeBundle.errors.length > 0) {
    throw new Error(`esbuild failed with errors at ${path}`);
  }

  const outputFile = runtimeBundle.outputFiles?.[0];

  if (!isDefined(outputFile)) {
    throw new Error(`esbuild built an empty result at ${path}`);
  }

  const staticOutputMeta = Object.values(
    staticBundle.metafile?.outputs ?? {}
  )[0];

  if (!isDefined(staticOutputMeta)) {
    throw new Error(`esbuild built empty static result at ${path}`);
  }

  const workerSrc = outputFile.text;

  return new Promise((resolve, reject) => {
    const worker = new Worker(workerSrc, { eval: true });
    worker.once("message", (pageDataOrError: RawPagefileData | Error) => {
      if (pageDataOrError instanceof Error) {
        reject(pageDataOrError);
      } else {
        // TODO: Could validate the shape of pageDataOrError at this point
        resolve({
          ...pageDataOrError,
          filePath: path,
          exports: staticOutputMeta.exports,
        });
      }
    });

    // Post an empty message to let the worker know we're ready
    worker.postMessage(void 0);
  });
}
