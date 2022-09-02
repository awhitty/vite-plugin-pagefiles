import { createTree, TreeNode } from "./createTree";
import {
  DuplicateLayoutAtPathError,
  DuplicateLayoutWithNameError,
  MissingLayoutError,
} from "./PagefilesError";
import { Trie } from "./Trie";
import { ImportModeFn, PagefileData } from "./types";

interface PagefileWithImportIndex extends PagefileData {
  importIndex: number;
}

interface RouteTreeNode {
  pagefile: PagefileWithImportIndex;
  path?: string;
  index?: boolean;
  children: RouteTreeNode[];
}

function generateAsyncImport(importName: string, filepath: string) {
  return `const ${importName} = React.lazy(() => import("${filepath}"));`;
}

function generateSyncImport(importName: string, filepath: string) {
  return `import ${importName} from "${filepath}";`;
}

function getImportName(i: number) {
  return `PagefilesImport${i}`;
}

function getPathKey(path: string) {
  return path === "/" ? [""] : path.split("/");
}

function resolveParentLayoutForFile(
  file: PagefileWithImportIndex,
  layoutsByName: Map<string, PagefileWithImportIndex>,
  layoutsByPath: Trie<PagefileWithImportIndex>
) {
  const layoutKey = file.meta.layout;
  const path = file.meta.path;

  if (layoutKey === null) {
    // File deliberately has no layout
    return {
      file: file,
      layout: null,
    };
  } else if (layoutKey) {
    // File has a layout specified by name
    const layout = layoutsByName.get(layoutKey);

    if (layout) {
      return {
        file: file,
        layout: layout,
      };
    } else {
      throw new MissingLayoutError(layoutKey, file.filePath);
    }
  } else if (path) {
    // File's layout should be determined by its nearest ancestor with a path

    if (file.isLayout) {
      // Find the nearest ancestor to avoid layout resolving to itself
      const ancestor = layoutsByPath.findAncestor(getPathKey(path));

      return {
        file: file,
        layout: ancestor,
      };
    } else {
      const layout = layoutsByPath.find(getPathKey(path));

      return {
        file: file,
        layout: layout,
      };
    }
  }

  // File has no layout
  return {
    file: file,
    layout: null,
  };
}

function createFileTree(pagefiles: PagefileWithImportIndex[]) {
  const layoutsByPath = new Trie<PagefileWithImportIndex>();
  const layoutsByName = new Map<string, PagefileWithImportIndex>();

  const layouts = pagefiles.filter((p) => p.isLayout);

  layouts.forEach((file) => {
    if (file.meta.path) {
      const key = getPathKey(file.meta.path);
      try {
        layoutsByPath.insert(key, file);
      } catch (e) {
        throw new DuplicateLayoutAtPathError(file.meta.path, file.filePath);
      }
    }
  });

  layouts.forEach((file) => {
    const resolvedName = file.resolvedName;

    if (resolvedName) {
      if (layoutsByName.has(resolvedName)) {
        throw new DuplicateLayoutWithNameError(resolvedName, file.filePath);
      } else {
        layoutsByName.set(resolvedName, file);
      }
    }
  });

  const layoutResolutions = pagefiles.map((file) =>
    resolveParentLayoutForFile(file, layoutsByName, layoutsByPath)
  );

  return createTree(
    layoutResolutions,
    (d) => d.file.filePath,
    (d) => d.layout?.filePath ?? null,
    (node, parent) => {
      if (node.file.isLayout) {
        return {
          pagefile: node.file,
          path: node.file.meta.path,
        };
      } else if (node.file.meta.path === parent?.file?.meta.path) {
        return {
          pagefile: node.file,
          index: true,
        };
      } else {
        return {
          pagefile: node.file,
          path: node.file.meta.path,
        };
      }
    }
  );
}

function createRouteTree(
  pagefiles: PagefileWithImportIndex[]
): RouteTreeNode[] {
  const tree = createFileTree(pagefiles);

  // Heuristic to order routes with fewer children first, assuming they are more
  // likely to be specific.
  const routeComparator = (a: RouteTreeNode, b: RouteTreeNode) =>
    a.children.length !== b.children.length
      ? a.children.length - b.children.length
      : a.path?.localeCompare(b.path ?? "") ?? 0;

  function traverse(
    node: TreeNode<{
      pagefile: PagefileWithImportIndex;
      index?: boolean;
      path?: string;
    }>
  ): RouteTreeNode[] {
    const children = node.children.map(traverse).flat().sort(routeComparator);

    return [
      {
        ...node.value,
        children,
      },
    ];
  }

  return tree.map(traverse).flat().sort(routeComparator);
}

function createRoutesString(nodes: RouteTreeNode[]): string {
  return nodes
    .map((node) => {
      const pagefile = node.pagefile;
      const importName = getImportName(pagefile.importIndex);

      const children = createRoutesString(node.children);

      const pathOrIndex = node.index
        ? "index: true,"
        : pagefile.meta.path
        ? `path: "${pagefile.meta.path}",`
        : "";

      const childrenStr = children.length > 0 ? `children: [${children}],` : "";

      return `{${pathOrIndex}${childrenStr}element: React.createElement(${importName})},`;
    })
    .join("\n");
}

export function generateRoutesFile(
  pagefiles: PagefileData[],
  getImportMode: ImportModeFn
) {
  const enumeratedPagefiles: PagefileWithImportIndex[] = pagefiles.map(
    (pagefile, i) => ({ ...pagefile, importIndex: i })
  );

  const pageImports = enumeratedPagefiles
    .map((file) => {
      const importName = getImportName(file.importIndex);
      return getImportMode(file) === "sync"
        ? generateSyncImport(importName, file.filePath)
        : generateAsyncImport(importName, file.filePath);
    })
    .join("\n");

  const tree = createRouteTree(enumeratedPagefiles);

  const pageRoutes = createRoutesString(tree);

  return `

import React from 'react';

${pageImports}

const routes = [\n${pageRoutes}\n];

export default routes;

`.trim();
}
