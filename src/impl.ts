import { slash, toArray } from "@antfu/utils";
import * as esbuild from "esbuild";
import fg from "fast-glob";
import { join, resolve } from "node:path";
import { Worker } from "node:worker_threads";

import { PageMeta, UserOptions } from "./types";

function getPageFiles(path: string): string[] {
  return fg.sync(slash(join(path, `**/*.page.tsx`)), {
    onlyFiles: true,
  });
}

export class PageContext {
  // private _server: ViteDevServer | undefined;
  private pageMetaMap = new Map<string, PageMeta>();

  rawOptions: UserOptions;
  root: string;
  // options: ResolvedOptions;
  // logger?: Logger;

  constructor(userOptions: UserOptions, viteRoot: string = process.cwd()) {
    this.rawOptions = userOptions;
    this.root = slash(viteRoot);
    // this.options = resolveOptions(userOptions, this.root);
    // debug.options(this.options);
  }

  // setLogger(logger: Logger) {
  //   this.logger = logger;
  // }
  //
  // setupViteServer(server: ViteDevServer) {
  //   if (this._server === server) return;
  //
  //   this._server = server;
  //   this.setupWatcher(server.watcher);
  // }
  //
  // setupWatcher(watcher: FSWatcher) {
  //   watcher.on("unlink", async (path) => {
  //     path = slash(path);
  //     if (!isTarget(path, this.options)) return;
  //     await this.removePage(path);
  //     this.onUpdate();
  //   });
  //   watcher.on("add", async (path) => {
  //     path = slash(path);
  //     if (!isTarget(path, this.options)) return;
  //     const page = this.options.dirs.find((i) =>
  //       path.startsWith(slash(resolve(this.root, i.dir)))
  //     )!;
  //     await this.addPage(path, page);
  //     this.onUpdate();
  //   });
  //
  //   watcher.on("change", async (path) => {
  //     path = slash(path);
  //     if (!isTarget(path, this.options)) return;
  //     const page = this.pageMetaMap.get(path);
  //     if (page) await this.options.resolver.hmr?.changed?.(this, path);
  //   });
  // }
  //
  async addPage(paths: string | string[]) {
    for (const path of toArray(paths)) {
      const result = await esbuild.build({
        stdin: {
          contents: `

import { parentPort } from 'node:worker_threads';
import { meta } from "${path}";

parentPort.once('message', message => parentPort.postMessage(meta));

          `.trim(),
          sourcefile: "imaginary.js",
          loader: "ts",
          resolveDir: join(__dirname, "src"),
        },
        platform: "neutral",
        format: "cjs",
        outdir: "none",
        metafile: true,
        write: false,
        bundle: true,
        // jsxFactory: "createElement",
        // inject: [resolve(__dirname, "../shim/react-shim.js")],
        loader: {
          ".js": "jsx",
        },
        logLevel: "silent",
      });

      const src = result.outputFiles[0].text;
      console.log(src);
      const worker = new Worker(src, { eval: true });
      worker.on("message", (message) => console.log(message));
      worker.postMessage("ping");

      // this.pageMetaMap.set(path, {
      //   path: path,
      //   route,
      // });
      // await this.options.resolver.hmr?.added?.(this, path);
    }
  }
  //
  // async removePage(path: string) {
  //   debug.pages("remove", path);
  //   this.pageMetaMap.delete(path);
  //   await this.options.resolver.hmr?.removed?.(this, path);
  // }
  //
  // onUpdate() {
  //   if (!this._server) return;
  //
  //   invalidatePagesModule(this._server);
  //   debug.hmr("Reload generated pages.");
  //   this._server.ws.send({
  //     type: "full-reload",
  //   });
  // }
  //
  // async resolveRoutes() {
  //   return this.options.resolver.resolveRoutes(this);
  // }

  async searchGlob() {
    const files = getPageFiles(slash(resolve(process.cwd(), "src")));
    // const pageDirFiles = this.options.dirs.map((page) => {
    //   const pagesDirPath = slash(resolve(this.options.root, page.dir));
    //   const files = getPageFiles(pagesDirPath, this.options);
    //   debug.search(page.dir, files);
    //   return {
    //     ...page,
    //     files: files.map((file) => slash(file)),
    //   };
    // });
    //
    for (const file of files) await this.addPage(file);
    //
    // debug.cache(this.pageRouteMap);
  }

  // get debug() {
  //   return debug;
  // }
  //
  // get pageRouteMap() {
  //   return this.pageMetaMap;
  // }
}
