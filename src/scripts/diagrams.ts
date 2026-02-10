/**
 * Client-side diagram renderer
 * Lazily loads Mermaid and Graphviz via dynamic imports (Vite code-splits
 * them into separate chunks) only when diagram elements exist on the page.
 */

let mermaidIdCounter = 0;

async function initDiagrams() {
  const mermaidDivs = document.querySelectorAll<HTMLDivElement>('.diagram-mermaid');
  const graphvizDivs = document.querySelectorAll<HTMLDivElement>('.diagram-graphviz');

  if (mermaidDivs.length === 0 && graphvizDivs.length === 0) return;

  const promises: Promise<void>[] = [];

  if (mermaidDivs.length > 0) {
    promises.push(renderMermaid(mermaidDivs));
  }

  if (graphvizDivs.length > 0) {
    promises.push(renderGraphviz(graphvizDivs));
  }

  await Promise.all(promises);

  // Notify lightbox that diagrams are ready
  document.dispatchEvent(new CustomEvent('diagrams:rendered'));
}

async function renderMermaid(divs: NodeListOf<HTMLDivElement>) {
  const mermaid = (await import('mermaid')).default;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    securityLevel: 'loose',
  });

  for (const div of divs) {
    try {
      const id = `mermaid-${mermaidIdCounter++}`;
      const { svg } = await mermaid.render(id, div.textContent || '');
      div.innerHTML = svg;
      div.classList.add('diagram-rendered');
    } catch (err) {
      console.error('Mermaid render error:', err);
      div.classList.add('diagram-error');
    }
  }
}

async function renderGraphviz(divs: NodeListOf<HTMLDivElement>) {
  const { Graphviz } = await import('@hpcc-js/wasm-graphviz');
  const graphviz = await Graphviz.load();

  for (const div of divs) {
    try {
      const svg = graphviz.layout(div.textContent || '', 'svg', 'dot');
      div.innerHTML = svg;
      div.classList.add('diagram-rendered');
    } catch (err) {
      console.error('Graphviz render error:', err);
      div.classList.add('diagram-error');
    }
  }
}

// Module scripts are deferred — DOM is already parsed when this runs
initDiagrams();
