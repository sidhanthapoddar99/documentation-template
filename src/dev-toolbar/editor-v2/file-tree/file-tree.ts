/**
 * File tree — renders sidebar tree, handles selection, auto-open matching
 */

export interface FileTreeCallbacks {
  onSelect: (filePath: string) => void;
}

export function renderFileTree(
  container: HTMLElement,
  tree: any,
  callbacks: FileTreeCallbacks,
): void {
  container.innerHTML = '';
  const ul = document.createElement('ul');
  ul.className = 'ev2-tree';
  const children = tree.children || [];
  for (const node of children) {
    ul.appendChild(createTreeNode(node, callbacks));
  }
  container.appendChild(ul);
}

function createTreeNode(node: any, callbacks: FileTreeCallbacks): HTMLLIElement {
  const li = document.createElement('li');

  if (node.type === 'folder') {
    li.className = 'ev2-tree-folder';
    const item = document.createElement('div');
    item.className = 'ev2-tree-item';
    item.innerHTML = `<span class="tree-chevron"></span><span class="tree-name">${node.displayName || node.name}</span>`;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      li.classList.toggle('collapsed');
    });
    li.appendChild(item);

    if (node.children?.length) {
      const childUl = document.createElement('ul');
      for (const child of node.children) {
        childUl.appendChild(createTreeNode(child, callbacks));
      }
      li.appendChild(childUl);
    }
  } else {
    const item = document.createElement('div');
    item.className = 'ev2-tree-item';
    item.dataset.path = node.path;
    const displayName = node.frontmatter?.sidebar_label || node.frontmatter?.title || node.displayName || node.name;
    const ext = node.extension || '';
    const showExt = ext && ext !== '.md' && ext !== '.mdx';
    item.innerHTML = `<span class="tree-name">${displayName}</span>${showExt ? `<span class="tree-ext">${ext.replace('.', '')}</span>` : ''}`;
    item.addEventListener('click', () => {
      document.querySelectorAll('.ev2-tree-item.active').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      callbacks.onSelect(node.path);
    });
    li.appendChild(item);
  }

  return li;
}

export function highlightTreeItem(container: HTMLElement, filePath: string): void {
  const item = container.querySelector(`.ev2-tree-item[data-path="${CSS.escape(filePath)}"]`);
  if (item) {
    document.querySelectorAll('.ev2-tree-item.active').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
  }
}

export function findFileByUrlPath(tree: any, urlPath: string, baseUrl: string): any | null {
  const urlSlug = urlPath.replace(baseUrl + '/', '').replace(baseUrl, '');
  if (!urlSlug) return null;

  const slugParts = urlSlug.split('/').filter(Boolean);

  function search(nodes: any[]): any | null {
    for (const node of nodes) {
      if (node.type === 'file' && (node.extension === '.md' || node.extension === '.mdx')) {
        const nameSlug = node.name.replace(/^\d+_/, '').replace(/\.(md|mdx)$/, '');
        if (slugParts[slugParts.length - 1] === nameSlug) return node;
      }
      if (node.children) {
        const found = search(node.children);
        if (found) return found;
      }
    }
    return null;
  }

  return search(tree.children || []);
}
