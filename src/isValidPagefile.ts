import { isDefined } from "./isDefined";
import { ExtractedPagefileData, PagefileData, PagefileMeta } from "./types";

function isValidPagefileMeta(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: Record<string, any>
): value is PagefileMeta {
  if (isDefined(value.path) && typeof value.path !== "string") {
    return false;
  }

  if (isDefined(value.name) && typeof value.name !== "string") {
    return false;
  }

  return !(isDefined(value.layout) && typeof value.layout !== "string");
}

export function validatePagefile(p: ExtractedPagefileData): string[] {
  const result = [];

  if (!isDefined(p.meta)) {
    result.push("Missing meta export");
  }

  if (isDefined(p.meta) && !isValidPagefileMeta(p.meta)) {
    result.push("Invalid meta export");
  }

  return result;
}

export function isValidPagefile(p: ExtractedPagefileData): p is PagefileData {
  return validatePagefile(p).length === 0;
}
