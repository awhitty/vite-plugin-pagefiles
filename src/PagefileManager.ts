import { slash, toArray } from "@antfu/utils";
import fg from "fast-glob";
import picomatch from "picomatch";
import { FSWatcher, ModuleNode, ResolvedConfig, ViteDevServer } from "vite";

import { extractPagefileData, RawPagefileData } from "./extractPagefileData";
import { generateRoutesFile } from "./generateRoutesFile";
import { isDefined } from "./isDefined";
import { isValidPagefile, validatePagefile } from "./isValidPagefile";
import { resolveOptions } from "./resolveOptions";
import { ResolvedOptions, UserOptions } from "./types";

export class PagefileManager {
  private server: ViteDevServer | undefined;
  private readonly pageMetaMap = new Map<string, RawPagefileData>();
  private readonly viteConfig: ResolvedConfig;
  private readonly options: ResolvedOptions;

  constructor(userOptions: UserOptions, viteConfig: ResolvedConfig) {
    this.viteConfig = viteConfig;
    this.options = resolveOptions(userOptions, this.viteConfig.root);
  }

  setupViteServer(server: ViteDevServer) {
    if (this.server !== server) {
      this.server = server;
      this.setupWatcher(server.watcher);
    }
  }

  async searchAndAddFiles() {
    const files = fg.sync(this.options.globs, {
      onlyFiles: true,
    });

    await this.addPages(files);

    if (isDefined(this.options.onRoutesGenerated)) {
      await this.options.onRoutesGenerated(this.getValidPagefiles());
    }
  }

  resolveVirtualModule(id: string) {
    if (id === this.options.moduleId) {
      return this.options.resolvedModuleId;
    }
  }

  async loadModule(id: string) {
    if (id === this.options.resolvedModuleId) {
      await this.callRoutesGeneratedHook();

      if (this.shouldThrowErrors()) {
        this.throwIfAnyInvalidPagefile();
      }

      const pagefiles = this.getValidPagefiles();
      const importMode = this.options.importMode;

      return generateRoutesFile(pagefiles, importMode);
    }
  }

  private async callRoutesGeneratedHook() {
    if (isDefined(this.options.onRoutesGenerated)) {
      await this.options.onRoutesGenerated(this.getValidPagefiles());
    }
  }

  private setupWatcher(watcher: FSWatcher) {
    const isMatchedFile = picomatch(this.options.globs);

    watcher.on("unlink", async (path) => {
      path = slash(path);
      if (isMatchedFile(path)) {
        await this.removePage(path);
        await this.onUpdate();
      }
    });

    watcher.on("add", async (path) => {
      path = slash(path);
      if (isMatchedFile(path)) {
        await this.addPages(path);
        await this.onUpdate();
      }
    });

    watcher.on("change", async (path) => {
      path = slash(path);
      if (isMatchedFile(path)) {
        await this.addPages(path);
        await this.onUpdate();
      }
    });
  }

  private async addPages(pathOrPaths: string | string[]) {
    const paths = toArray(pathOrPaths);
    try {
      const data = await extractPagefileData(this.viteConfig.root, paths);
      data.forEach((d) => {
        this.pageMetaMap.set(d.filePath, d);
      });
    } catch (e) {
      if (this.shouldThrowErrors()) {
        throw e;
      } else {
        this.viteConfig.logger.error((e as Error).toString());
      }
    }
  }

  private async removePage(path: string) {
    this.pageMetaMap.delete(path);
  }

  private invalidatePagesModule(server: ViteDevServer) {
    const { moduleGraph } = server;
    const mods = moduleGraph.getModulesByFile(this.options.resolvedModuleId);
    if (mods) {
      const seen = new Set<ModuleNode>();
      mods.forEach((mod) => {
        moduleGraph.invalidateModule(mod, seen);
      });
    }
  }

  private async onUpdate() {
    if (this.server) {
      this.invalidatePagesModule(this.server);
    }
  }

  private getValidPagefiles() {
    return this.getAllPagefiles().filter(isValidPagefile);
  }

  private getAllPagefiles() {
    return Array.from(this.pageMetaMap.values());
  }

  private throwIfAnyInvalidPagefile() {
    const badFile = this.getAllPagefiles().find((p) => !isValidPagefile(p));
    if (badFile) {
      const reasons = validatePagefile(badFile);
      throw new Error(
        `Bad pagefile at ${badFile.filePath}: ${reasons.join(", ")}`
      );
    }
  }

  private shouldThrowErrors() {
    return (
      this.viteConfig.command === "build" ||
      this.viteConfig.mode === "production"
    );
  }
}
