/**
 * Client-side diagram renderer
 * Lazily loads Mermaid and Graphviz via dynamic imports (Vite code-splits
 * them into separate chunks) only when diagram elements exist on the page.
 *
 * Re-renders mermaid diagrams on theme change so dark mode colors are correct.
 */

let mermaidIdCounter = 0;
let mermaidModule: typeof import('mermaid')['default'] | null = null;

async function initDiagrams() {
  const mermaidDivs = document.querySelectorAll<HTMLDivElement>('.diagram-mermaid:not(.diagram-rendered):not(.diagram-error)');
  const graphvizDivs = document.querySelectorAll<HTMLDivElement>('.diagram-graphviz:not(.diagram-rendered):not(.diagram-error)');

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
  if (!mermaidModule) {
    mermaidModule = (await import('mermaid')).default;
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  mermaidModule.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    securityLevel: 'loose',
  });

  for (const div of divs) {
    try {
      // Store original source for re-rendering on theme change
      if (!div.dataset.source) {
        div.dataset.source = div.textContent || '';
      }
      const id = `mermaid-${mermaidIdCounter++}`;
      const { svg } = await mermaidModule.render(id, div.dataset.source);
      div.innerHTML = svg;
      div.classList.add('diagram-rendered');
    } catch (err) {
      console.error('Mermaid render error:', err);
      div.classList.add('diagram-error');
    }
  }
}

async function reRenderMermaid() {
  const rendered = document.querySelectorAll<HTMLDivElement>('.diagram-mermaid.diagram-rendered');
  if (rendered.length === 0 || !mermaidModule) return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  mermaidModule.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    securityLevel: 'loose',
  });

  for (const div of rendered) {
    const source = div.dataset.source;
    if (!source) continue;
    try {
      const id = `mermaid-${mermaidIdCounter++}`;
      const { svg } = await mermaidModule.render(id, source);
      div.innerHTML = svg;
    } catch (err) {
      console.error('Mermaid re-render error:', err);
    }
  }

  document.dispatchEvent(new CustomEvent('diagrams:rendered'));
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

// Allow editor preview to trigger re-rendering when content updates
document.addEventListener('diagrams:render', () => initDiagrams());

// Re-render mermaid diagrams when theme changes
const observer = new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.attributeName === 'data-theme') {
      reRenderMermaid();
      break;
    }
  }
});
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
