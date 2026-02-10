/**
 * Lightbox — click-to-expand for images in markdown content.
 * Adds a full-screen overlay on click, closes on overlay click or Escape.
 */

function initLightbox() {
  const images = document.querySelectorAll<HTMLImageElement>('.markdown-content img');
  if (images.length === 0) return;

  // Create overlay once
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = '<img class="lightbox-img" />';
  document.body.appendChild(overlay);

  const lightboxImg = overlay.querySelector<HTMLImageElement>('.lightbox-img')!;

  // Open on image click
  for (const img of images) {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      overlay.classList.add('lightbox-open');
    });
  }

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target === lightboxImg) {
      overlay.classList.remove('lightbox-open');
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('lightbox-open')) {
      overlay.classList.remove('lightbox-open');
    }
  });
}

// Module scripts are deferred — DOM is already parsed when this runs
initLightbox();
