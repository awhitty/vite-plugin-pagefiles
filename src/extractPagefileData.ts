import * as esbuild from "esbuild";
import { OnLoadResult, PluginBuild } from "esbuild";
import { Worker } from "node:worker_threads";

import { isDefined } from "./isDefined";
import { UnableToExtractMetaError } from "./PagefilesError";
import { ExtractedPagefileData } from "./types";

function createEsbuildContents(root: string, contents: string): OnLoadResult {
  return {
    loader: "ts",
    contents: contents,
    resolveDir: root,
  };
}

function createEsbuildPlugin(contents: OnLoadResult, allowlist: string[]) {
  return {
    name: "entrypoint-override",
    setup(build: PluginBuild) {
      const skipResolve = {};
      build.onResolve({ filter: /.*/ }, async (args) => {
        if (args.pluginData === skipResolve) {
          return;
        }

        if (allowlist.includes(args.path)) {
          return await build.resolve(args.path, {
            resolveDir: args.resolveDir,
            pluginData: skipResolve,
          });
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
        contents: `
function recursiveProxyMock() {
  return recursiveProxyRecurse();
}

function recursiveProxyRecurse() {
  const recursiveProxyInstance = function () { };
  return new Proxy(recursiveProxyInstance, {
    apply: () => recursiveProxyRecurse(),
    construct: () => recursiveProxyRecurse(),
    defineProperty: () => true,
    deleteProperty: () => true,
    get: (target, prop) =>
      prop === Symbol.toPrimitive ? () => "" : recursiveProxyRecurse(),
    getOwnPropertyDescriptor: (target, prop) =>
      typeof prop === "string" && ["arguments", "caller", "prototype"].includes(prop) ? Reflect.getOwnPropertyDescriptor(target, prop) : {
        configurable: true,
        enumerable: true,
        writable: true,
        value: recursiveProxyRecurse(),
      },
    getPrototypeOf: () => recursiveProxyMock(),
    has: () => true,
    isExtensible: () => true,
    ownKeys: () => ["arguments", "caller", "prototype"],
    preventExtensions: () => false,
    set: () => true,
    setPrototypeOf: () => true,
  });
}

module.exports = recursiveProxyMock();
module.__esModule = true;
          `.trim(),
      }));
    },
  };
}

/**
 * Attempts to extract the path to some file that caused a build failure based
 * on the text of the first error message.
 */
function extractFilePathFromFirstBuildFailure(failure: esbuild.BuildFailure) {
  const firstError = failure.errors[0];
  return firstError.text.match(
    /No matching export in "([\w\W]*)" for import "Meta"/
  )?.[1];
}

interface ExtractionWorkerData {
  meta: object;
  name?: string;
  displayName?: string;
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
  paths: string[]
): Promise<ExtractedPagefileData[]> {
  const pathImports = paths
    .map(
      (path, i) =>
        `import { default as Default${i}, Meta as Meta${i} } from "${path}";`
    )
    .join("\n");

  const pathMessages = paths
    .map(
      (_, i) =>
        `{ meta: Meta${i}(), name: Default${i}.name, displayName: Default${i}.displayName }`
    )
    .join(",");

  const plugin = createEsbuildPlugin(
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
    ),
    [...paths, "node:worker_threads", "node:process", "entrypoint.js"]
  );

  let buildResult: esbuild.BuildResult;
  try {
    buildResult = await esbuild.build({
      platform: "node",
      format: "cjs",
      outdir: ".",
      write: false,
      bundle: true,
      logLevel: "silent",
      metafile: true,
      loader: {
        ".png": "text",
        ".svg": "text",
      },
      plugins: [plugin],
      entryPoints: ["entrypoint.js"],
    });
  } catch (failure) {
    const castFailure = failure as esbuild.BuildFailure;
    const matchingFile = extractFilePathFromFirstBuildFailure(castFailure);
    throw new UnableToExtractMetaError(matchingFile);
  }

  const outputFile = buildResult.outputFiles?.[0];

  if (!isDefined(outputFile)) {
    // Not sure if this case is possible
    throw new UnableToExtractMetaError();
  }

  const workerSrc = outputFile.text;

  return new Promise((resolve, reject) => {
    const worker = new Worker(workerSrc, { eval: true });

    worker.once("message", (importExtractions: ExtractionWorkerData[]) => {
      resolve(
        // TODO: Validate shape of meta values at this point
        importExtractions.map((extraction, i) => ({
          meta: extraction.meta,
          defaultExportName: extraction.name,
          defaultExportDisplayName: extraction.displayName,
          filePath: paths[i],
        }))
      );
    });

    worker.once("error", (error) => {
      reject(error);
    });

    // Post an empty message to let the worker know we're ready
    worker.postMessage(void 0);
  });
}
