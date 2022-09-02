import { groupBy } from "./groupBy";

export interface TreeNode<T> {
  value: T;
  children: TreeNode<T>[];
}

export function createTree<T, V>(
  data: T[],
  getId: (item: T) => string,
  getParentId: (item: T) => string | null,
  mapValue: (item: T, parent: T | null) => V
): TreeNode<V>[] {
  const grouped = groupBy(data, getParentId);

  function childrenOf(parent: T | null): TreeNode<V>[] {
    const parentId = parent ? getId(parent) : null;
    const children = grouped.get(parentId) ?? [];
    return children.map((item) => ({
      value: mapValue(item, parent),
      children: childrenOf(item),
    }));
  }

  return childrenOf(null);
}
