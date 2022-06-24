import * as esbuild from "esbuild";
import { OnLoadResult, PluginBuild } from "esbuild";
import { Worker } from "node:worker_threads";

import { isDefined } from "./isDefined";
import { PagefileMeta } from "./types";

export interface RawPagefileData {
  filePath: string;
  meta?: PagefileMeta;
}

function createEsbuildContents(root: string, contents: string): OnLoadResult {
  return {
    loader: "ts",
    contents: contents,
    resolveDir: root,
  };
}

function createEsbuildPlugin() {
  let contents: OnLoadResult = { contents: "" };
  let allowlist: string[] = [];
  return {
    setContents: (val: OnLoadResult) => {
      contents = val;
    },
    setAllowlist: (val: string[]) => {
      allowlist = val;
    },
    plugin: {
      name: "entrypoint-override",
      setup(build: PluginBuild) {
        const skipResolve = {};
        build.onResolve({ filter: /.*/ }, async (args) => {
          if (args.pluginData === skipResolve) {
            return;
          }

          if (allowlist.includes(args.path)) {
            const resolveResult = await build.resolve(args.path, {
              resolveDir: args.resolveDir,
              pluginData: skipResolve,
            });

            return resolveResult;
          } else {
            return { path: "null.js", namespace: "null" };
          }
        });

        build.onResolve({ filter: /^entrypoint\.js$/ }, (args) => ({
          path: args.path,
          namespace: "entrypoint-override",
        }));

        build.onLoad(
          { filter: /.*/, namespace: "entrypoint-override" },
          () => contents
        );

        build.onLoad({ filter: /.*/, namespace: "null" }, () => ({
          contents: `module.exports = {}`,
        }));
      },
    },
  };
}

const pluginInstance = createEsbuildPlugin();

const esbuildInstance = esbuild.build({
  platform: "node",
  format: "cjs",
  outdir: ".",
  write: false,
  bundle: true,
  incremental: true,
  logLevel: "silent",
  metafile: true,
  loader: {
    ".png": "text",
    ".svg": "text",
  },
  plugins: [pluginInstance.plugin],
  entryPoints: ["entrypoint.js"],
});

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
  paths: string[]
): Promise<RawPagefileData[]> {
  const runtimeB = await esbuildInstance;

  const pathImports = paths
    .map((path, i) => `import { Meta as Meta${i} } from "${path}";`)
    .join("\n");

  const pathMessages = paths.map((_, i) => `Meta${i}()`).join(",");

  pluginInstance.setContents(
    createEsbuildContents(
      root,
      `

import { parentPort } from 'node:worker_threads';
import { exit } from 'node:process';

${pathImports}

parentPort.once('message', async () => {
  parentPort.postMessage([${pathMessages}]);
  exit(0);
});

      `.trim()
    )
  );

  pluginInstance.setAllowlist([
    ...paths,
    "node:worker_threads",
    "node:process",
    "entrypoint.js",
  ]);

  const runtimeBundle = await runtimeB.rebuild!();

  if (runtimeBundle.errors.length > 0) {
    throw new Error(`esbuild failed with errors`);
  }

  const outputFile = runtimeBundle.outputFiles?.[0];

  if (!isDefined(outputFile)) {
    throw new Error(`esbuild built an empty result`);
  }

  const workerSrc = outputFile.text;

  return new Promise((resolve, reject) => {
    const worker = new Worker(workerSrc, { eval: true });

    worker.once("message", (metas: unknown[]) => {
      resolve(
        // TODO: Validate shape of meta values at this point
        metas.map((meta, i) => ({ meta: meta as any, filePath: paths[i] }))
      );
    });

    worker.once("error", (error) => {
      reject(error);
    });

    // Post an empty message to let the worker know we're ready
    worker.postMessage(void 0);
  });
}
