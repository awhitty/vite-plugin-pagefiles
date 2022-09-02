enum PagefilesErrorCode {
  UnknownError = "UnknownError",
  MissingLayout = "MissingLayout",
  DuplicateLayoutAtPath = "DuplicateLayoutAtPath",
  DuplicateLayoutWithName = "DuplicateLayoutWithName",
  InvalidPagefile = "InvalidPagefile",
  UnableToExtractMeta = "UnableToExtractMeta",
}

const pagefilesErrorMarker = Symbol();

export interface PagefilesError {
  errorCode: PagefilesErrorCode;
  message: string;
  sourceFile?: string;
}

export class UnknownError implements PagefilesError {
  originalMessage: string | null = null;
  readonly [pagefilesErrorMarker] = true;
  readonly errorCode = PagefilesErrorCode.UnknownError;
  readonly message = `Unknown error${
    this.originalMessage ? `: ${this.originalMessage}` : ""
  }`;

  constructor(originalError?: unknown) {
    if (typeof originalError === "object" && originalError != null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.originalMessage = (originalError as any).message ?? "";
    }
  }
}

export class MissingLayoutError implements PagefilesError {
  readonly [pagefilesErrorMarker] = true;
  readonly errorCode = PagefilesErrorCode.MissingLayout;
  readonly message = `Layout "${this.layoutKey}" not found`;
  constructor(public layoutKey: string, public sourceFile?: string) {}
}

export class DuplicateLayoutAtPathError implements PagefilesError {
  readonly [pagefilesErrorMarker] = true;
  readonly errorCode = PagefilesErrorCode.DuplicateLayoutAtPath;
  readonly message = `Duplicate layout at path "${this.path}"`;
  constructor(public path: string, public sourceFile?: string) {}
}

export class DuplicateLayoutWithNameError implements PagefilesError {
  readonly [pagefilesErrorMarker] = true;
  readonly errorCode = PagefilesErrorCode.DuplicateLayoutWithName;
  readonly message = `Duplicate layout with name "${this.name}"`;
  constructor(public name: string, public sourceFile?: string) {}
}

export class InvalidPagefileError implements PagefilesError {
  readonly [pagefilesErrorMarker] = true;
  readonly errorCode = PagefilesErrorCode.InvalidPagefile;
  readonly message = `Invalid pagefile: "${this.reasons.join(", ")}"`;
  constructor(public sourceFile: string, public reasons: string[]) {}
}

export class UnableToExtractMetaError implements PagefilesError {
  readonly [pagefilesErrorMarker] = true;
  readonly errorCode = PagefilesErrorCode.UnableToExtractMeta;
  readonly message = `Unable to extract meta from file`;
  constructor(public sourceFile?: string) {}
}

export function isPagefilesError(error: unknown): error is PagefilesError {
  return (
    typeof error === "object" && error != null && pagefilesErrorMarker in error
  );
}
