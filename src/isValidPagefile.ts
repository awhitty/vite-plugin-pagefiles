import { RawPagefileData } from "./extractPagefileData";
import { isDefined } from "./isDefined";
import { PagefileData } from "./types";

export function validatePagefile(p: RawPagefileData): string[] {
  const result = [];

  if (!isDefined(p.meta)) {
    result.push("Missing meta export");
  }

  if (!p.exports.includes("default")) {
    result.push("Missing default export");
  }

  return result;
}

export function isValidPagefile(p: RawPagefileData): p is PagefileData {
  return validatePagefile(p).length === 0;
}
