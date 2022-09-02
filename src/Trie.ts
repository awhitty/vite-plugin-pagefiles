export class TrieNode<T> {
  constructor(
    public children: Record<string, TrieNode<T>> = {},
    public value: T | null = null
  ) {}
}

export class Trie<T> {
  root: TrieNode<T>;

  constructor() {
    this.root = new TrieNode();
  }

  insert(key: string[], value: T, node = this.root): void {
    if (key.length === 0) {
      if (node.value) {
        throw new Error(`Duplicate value at key ${key}`);
      }

      node.value = value;
      return;
    } else if (node.children[key[0]]) {
      return this.insert(key.slice(1), value, node.children[key[0]]);
    } else {
      node.children[key[0]] = new TrieNode();
      return this.insert(key.slice(1), value, node.children[key[0]]);
    }
  }

  find(key: string[]): T | null {
    let node = this.root;
    while (key.length > 0) {
      const nextKey: string = key[0];
      if (node.children[nextKey]) {
        node = node.children[nextKey];
        key = key.slice(1);
      } else {
        return node.value;
      }
    }
    return node.value;
  }

  findAncestor(key: string[]): T | null {
    let parent: T | null = null;
    let node = this.root;
    while (key.length > 0) {
      const nextKey: string = key[0];
      if (node.children[nextKey]) {
        parent = node.value;
        node = node.children[nextKey];
        key = key.slice(1);
      } else {
        return node.value;
      }
    }
    return parent;
  }
}
