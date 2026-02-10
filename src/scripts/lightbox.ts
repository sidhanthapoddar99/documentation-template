/**
 * Lightbox — click-to-expand for images and diagrams in markdown content.
 * Adds a full-screen overlay on click, closes on overlay click or Escape.
 */

let overlay: HTMLDivElement | null = null;
let contentEl: HTMLDivElement | null = null;
const boundElements = new WeakSet();

function ensureOverlay() {
  if (overlay) return;

  overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  contentEl = document.createElement('div');
  contentEl.className = 'lightbox-content';
  overlay.appendChild(contentEl);
  document.body.appendChild(overlay);

  // Close on overlay background click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay!.classList.contains('lightbox-open')) {
      close();
    }
  });
}

function open(el: HTMLImageElement | HTMLDivElement) {
  ensureOverlay();
  contentEl!.innerHTML = '';

  if (el instanceof HTMLImageElement) {
    const img = document.createElement('img');
    img.className = 'lightbox-img';
    img.src = el.src;
    img.alt = el.alt;
    contentEl!.appendChild(img);
  } else {
    const svg = el.querySelector('svg');
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGElement;
    clone.classList.add('lightbox-svg');
    contentEl!.appendChild(clone);
  }

  overlay!.classList.add('lightbox-open');
}

function close() {
  overlay?.classList.remove('lightbox-open');
}

function bindImages() {
  const images = document.querySelectorAll<HTMLImageElement>('.markdown-content img');
  for (const img of images) {
    if (boundElements.has(img)) continue;
    boundElements.add(img);
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => open(img));
  }
}

function bindDiagrams() {
  const diagrams = document.querySelectorAll<HTMLDivElement>('.markdown-content .diagram-rendered');
  for (const diagram of diagrams) {
    if (boundElements.has(diagram)) continue;
    boundElements.add(diagram);
    diagram.style.cursor = 'zoom-in';
    diagram.addEventListener('click', () => open(diagram));
  }
}

// Bind images immediately (they're in the DOM already)
bindImages();

// Bind diagrams now (in case they rendered before this script)
bindDiagrams();

// Re-bind when diagrams finish rendering asynchronously
document.addEventListener('diagrams:rendered', bindDiagrams);
