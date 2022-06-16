/**
 * Contains any data exported from pagefiles that will be made available for
 * processing by the plugin and any plugin hooks. Values must be supported by
 * with the "structured clone algorithm".
 *
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm}
 */
export interface PagefileMeta {
  path: string;
}

export type PagefileMetaFn = () => PagefileMeta;

export interface PagefileData {
  filePath: string;
  exports: string[];
  meta: PagefileMeta;
}

export type ImportMode = "sync" | "async";
export type ImportModeFn = (pagefileData: PagefileData) => ImportMode;

export interface UserOptions {
  /**
   * Glob pattern(s) of files to process as pagefiles.
   *
   * @default src/**.page.tsx
   */
  files?: string | string[];

  /**
   * Name of the virtual module made available to client code. Useful if running
   * multiple instances of the plugin
   *
   * @default virtual:pagefiles
   */
  moduleId?: string;

  /**
   * Specifies whether to use sync or async (i.e. `React.lazy()`) loading for
   * pagefiles. Accepts a function to process files individually.
   *
   * @default `sync` for the top-level `/` path, `async` for everything else
   */
  importMode?: ImportMode | ImportModeFn;

  /**
   * Optional hook that's called whenever the generated routes change
   */
  onRoutesGenerated?: (pagefiles: PagefileData[]) => void | Promise<void>;
}

export interface ResolvedOptions {
  globs: string[];
  moduleId: string;
  resolvedModuleId: string;
  importMode: ImportModeFn;
  onRoutesGenerated?: (pagefiles: PagefileData[]) => void | Promise<void>;
}
