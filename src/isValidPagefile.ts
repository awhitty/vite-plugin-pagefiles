import { isDefined } from "./isDefined";
import { PagefileData, PagefileMeta } from "./types";

export interface RawPagefileData {
  filePath: string;
  exportNames: string[];
  meta?: PagefileMeta;
  defaultExportDisplayName?: string;
}

export function validatePagefile(p: RawPagefileData): string[] {
  const result = [];

  if (!isDefined(p.meta)) {
    result.push("Missing meta export");
  }

  if (!p.exportNames.includes("default")) {
    result.push("Missing default export");
  }

  return result;
}

export function isValidPagefile(p: RawPagefileData): p is PagefileData {
  return validatePagefile(p).length === 0;
}
