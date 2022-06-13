import { slash, toArray } from "@antfu/utils";
import { join, resolve } from "node:path";

import { isDefined } from "./isDefined";
import {
  ImportModeFn,
  PagefileData,
  ResolvedOptions,
  UserOptions,
} from "./types";

const DEFAULT_SEARCH_GLOB = `src/**/*.page.tsx`;
const DEFAULT_MODULE_ID = "virtual:pagefiles";
const DEFAULT_IMPORT_MODE = (pagefileData: PagefileData) =>
  pagefileData.meta?.path === "/" ? "sync" : "async";

export function resolveOptions(
  options: UserOptions,
  root: string
): ResolvedOptions {
  const globs = toArray(options.files ?? DEFAULT_SEARCH_GLOB).map((g) =>
    slash(resolve(join(root, g)))
  );

  const moduleId = options.moduleId ?? DEFAULT_MODULE_ID;

  const importModeOption = options.importMode;

  let importMode: ImportModeFn = DEFAULT_IMPORT_MODE;

  if (isDefined(importModeOption)) {
    if (typeof importModeOption === "function") {
      importMode = importModeOption;
    } else {
      importMode = () => importModeOption;
    }
  }

  return {
    globs: globs,
    moduleId: moduleId,
    resolvedModuleId: `/@vite-plugin-pagefiles/${moduleId}`,
    importMode: importMode,
    onRoutesGenerated: options.onRoutesGenerated,
  };
}
