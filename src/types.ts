/**
 * PagefileMeta allows control over how the pagefile behaves in routing and
 * layout. The `path` property is the primary mechanism for routing, though
 * `name` and `layout` can be used to customize how pages are and layouts are
 * nested.
 *
 * Values must be supported by the "structured clone algorithm".
 *
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm}
 */
export interface PagefileMeta {
  /**
   * Optional path for the page or layout. This value should be defined for
   * pages to make the page available in routing. This value can be omitted for
   * layouts to create a "pathless layout".
   */
  path?: string;

  /**
   * Optional name to use for the pagefile if used as a layout. A layout's name
   * is resolved in the following order:
   *
   *   1. This property
   *   2. The displayName of the default export
   *   3. The name of the default export
   *
   * If the name cannot be resolved, the layout will not be referencable by
   * name, but it may still be used as a layout by path.
   */
  name?: string;

  /**
   * Optional specifier for the parent layout to use. This value references the
   * resolved name of the layout. If this value is omitted, the parent layout
   * will be resolved based on the routable path. If this value is `null`, the
   * pagefile will not be wrapped in a layout.
   *
   * This property can create some logical conflicts if the `path` property of
   * the parent layout is not an ancestor of the `path` property of the child.
   * For example, if the parent layout has a `path` of `/foo` and the child has
   * a `path` of `/bar`, the resulting route definition will be invalid.
   */
  layout?: string | null;
}

export type PagefileMetaFn = () => PagefileMeta;

export interface PagefileData {
  filePath: string;
  isLayout: boolean;
  meta: PagefileMeta;
  resolvedName?: string;
}

export interface ExtractedPagefileData {
  filePath: string;
  meta?: PagefileMeta;
  defaultExportName?: string;
  defaultExportDisplayName?: string;
}
export type ImportMode = "sync" | "async";

export type ImportModeFn = (pagefileData: PagefileData) => ImportMode;

export interface UserOptions {
  /**
   * Glob pattern(s) of files to process as pages.
   *
   * @default 'src/**.page.tsx'
   */
  pages?: string | string[];

  /**
   * Glob pattern(s) of files to process as pages.
   *
   * @default 'src/**.layout.tsx'
   */
  layouts?: string | string[];

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
  pageGlobs: string[];
  layoutGlobs: string[];
  moduleId: string;
  resolvedModuleId: string;
  importMode: ImportModeFn;
  onRoutesGenerated?: (pagefiles: PagefileData[]) => void | Promise<void>;
}
