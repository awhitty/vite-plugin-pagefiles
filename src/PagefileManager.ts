import { slash, toArray } from "@antfu/utils";
import fg from "fast-glob";
import colors from "picocolors";
import picomatch from "picomatch";
import { FSWatcher, ModuleNode, ResolvedConfig, ViteDevServer } from "vite";

import { PLUGIN_NAME } from "./constants";
import { extractPagefileData } from "./extractPagefileData";
import { generateRoutesFile } from "./generateRoutesFile";
import { isDefined } from "./isDefined";
import { isValidPagefile, validatePagefile } from "./isValidPagefile";
import {
  InvalidPagefileError,
  isPagefilesError,
  PagefilesError,
  UnknownError,
} from "./PagefilesError";
import { resolveOptions } from "./resolveOptions";
import {
  ExtractedPagefileData,
  PagefileData,
  ResolvedOptions,
  UserOptions,
} from "./types";

export class PagefileManager {
  private readonly pageMetaMap = new Map<string, ExtractedPagefileData>();
  private readonly viteConfig: ResolvedConfig;
  private readonly options: ResolvedOptions;
  private readonly isMatchedPage: picomatch.Matcher;
  private readonly isMatchedLayout: picomatch.Matcher;

  private server: ViteDevServer | undefined;
  private cachedRoutesFile: string | null = null;

  constructor(userOptions: UserOptions, viteConfig: ResolvedConfig) {
    this.viteConfig = viteConfig;
    this.options = resolveOptions(userOptions, this.viteConfig.root);
    this.isMatchedPage = picomatch(this.options.pageGlobs);
    this.isMatchedLayout = picomatch(this.options.layoutGlobs);
  }

  setupViteServer(server: ViteDevServer) {
    if (this.server !== server) {
      this.server = server;
      this.setupWatcher(server.watcher);
    }
  }

  async searchAndAddFiles() {
    const files = fg.sync(
      [...this.options.pageGlobs, ...this.options.layoutGlobs],
      {
        onlyFiles: true,
      }
    );

    await this.addPages(files);
    await this.callRoutesGeneratedHook();
  }

  resolveVirtualModule(id: string) {
    if (id === this.options.moduleId) {
      return this.options.resolvedModuleId;
    }
  }

  async loadModule(id: string) {
    if (id === this.options.resolvedModuleId) {
      await this.callRoutesGeneratedHook();

      this.throwOrLogInvalidPagefiles();

      return this.cachedRoutesFile ?? this.generateRoutesFile();
    }
  }

  private async callRoutesGeneratedHook() {
    if (isDefined(this.options.onRoutesGenerated)) {
      await this.options.onRoutesGenerated(this.getValidPagefiles());
    }
  }

  private setupWatcher(watcher: FSWatcher) {
    watcher.on("unlink", async (path) => {
      path = slash(path);
      if (this.isMatchedPage(path) || this.isMatchedLayout(path)) {
        await this.removePage(path);
        await this.onUpdate();
      }
    });

    watcher.on("add", async (path) => {
      path = slash(path);
      if (this.isMatchedPage(path) || this.isMatchedLayout(path)) {
        await this.addPages(path);
        await this.onUpdate();
      }
    });

    watcher.on("change", async (path) => {
      path = slash(path);
      if (this.isMatchedPage(path) || this.isMatchedLayout(path)) {
        await this.addPages(path);
        await this.onUpdate();
      }
    });
  }

  private async addPages(pathOrPaths: string | string[]) {
    const paths = toArray(pathOrPaths);
    try {
      const data = await extractPagefileData(this.viteConfig.root, paths);
      data.forEach((file) => {
        this.pageMetaMap.set(file.filePath, file);
      });
    } catch (e) {
      if (this.shouldThrowErrors()) {
        throw e;
      } else {
        this.logError(e);
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

    const nextValue = this.generateRoutesFile();
    if (nextValue !== this.cachedRoutesFile) {
      this.cachedRoutesFile = nextValue ?? null;
      this.server?.watcher.emit("change", this.options.resolvedModuleId);
    }
  }

  private generateRoutesFile() {
    try {
      const pagefiles = this.getValidPagefiles();
      const importMode = this.options.importMode;
      return generateRoutesFile(pagefiles, importMode);
    } catch (e) {
      if (this.shouldThrowErrors()) {
        throw e;
      } else {
        this.logError(e);
      }
    }
  }

  private logError(e: unknown) {
    if (isPagefilesError(e)) {
      this.logPagefilesError(e);
    } else {
      this.logPagefilesError(new UnknownError(e));
    }
  }

  private logPagefilesError(e: PagefilesError) {
    this.viteConfig.logger.error(
      [
        e.message,
        `  Plugin: ${colors.magenta(PLUGIN_NAME)}`,
        `  File: ${colors.cyan(e.sourceFile)}`,
      ].join("\n")
    );

    this.server?.ws.send({
      type: "error",
      err: {
        plugin: PLUGIN_NAME,
        message: `${e.message}${
          e.sourceFile ? `\n\nFile: ${e.sourceFile}` : ""
        }`,
        id: e.errorCode,
        stack: "",
      },
    });
  }

  private async onUpdate() {
    if (this.server) {
      this.invalidatePagesModule(this.server);
    }
  }

  private getValidPagefiles(): PagefileData[] {
    return this.getAllPagefiles()
      .map((file) => ({
        meta: file.meta,
        filePath: file.filePath,
        isLayout: this.isMatchedLayout(file.filePath),
        resolvedName:
          file.meta?.name ??
          file.defaultExportDisplayName ??
          file.defaultExportName,
      }))
      .filter(isValidPagefile) as PagefileData[];
  }

  private getAllPagefiles() {
    return Array.from(this.pageMetaMap.values());
  }

  private throwOrLogInvalidPagefiles() {
    const badFile = this.getAllPagefiles().find((p) => !isValidPagefile(p));
    if (badFile) {
      const reasons = validatePagefile(badFile);
      const error = new InvalidPagefileError(badFile.filePath, reasons);

      if (this.shouldThrowErrors()) {
        throw error;
      } else {
        this.logError(error);
      }
    }
  }

  private shouldThrowErrors() {
    return (
      this.viteConfig.command === "build" ||
      this.viteConfig.mode === "production"
    );
  }
}
