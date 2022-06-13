import { ImportModeFn, PagefileData } from "./types";

function generateAsyncImport(importName: string, filepath: string) {
  return `const ${importName} = React.lazy(() => import("${filepath}"));`;
}

function generateSyncImport(importName: string, filepath: string) {
  return `import ${importName} from "${filepath}";`;
}

function generateRouteForFile(file: PagefileData, importName: string) {
  return `{ path: "${file.meta.path}", element: React.createElement(${importName}) }`;
}

export function generateRoutesFile(
  pagefiles: PagefileData[],
  getImportMode: ImportModeFn
) {
  const getImportName = (i: number) => `PagefilesImport${i}`;

  const sortedPagefiles = pagefiles.sort((a, b) =>
    a.meta.path.localeCompare(b.meta.path)
  );

  const pageImports = sortedPagefiles
    .map((file, i) => {
      const importName = getImportName(i);
      return getImportMode(file) === "sync"
        ? generateSyncImport(importName, file.filePath)
        : generateAsyncImport(importName, file.filePath);
    })
    .join("\n");

  const pageRoutes = sortedPagefiles
    .map((file, i) => `  ${generateRouteForFile(file, getImportName(i))},`)
    .join("\n");

  return `

import React from 'react';

${pageImports}

const routes = [\n${pageRoutes}\n];

export default routes;

`.trim();
}
