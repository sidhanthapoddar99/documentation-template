/**
 * Dev Toolbar - Layout & Theme Selector
 *
 * Provides development-time UI for:
 * - Switching between doc layouts when on /docs/* pages
 * - Switching between blog layouts when on /blog/* pages
 * - Toggling theme (light/dark/system) globally
 */

// Available layouts (discovered from src/layouts/*/styles/)
const LAYOUTS = {
  docs: ['doc_style1', 'doc_style2'],
  blog: ['blog_style1', 'blog_style2'],
} as const;

const THEMES = ['light', 'dark', 'system'] as const;

export default {
  id: 'layout-theme-selector',
  name: 'Layout & Theme',
  icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,

  init(canvas: ShadowRoot, _app: any, _server: any) {
    // Detect content type from data attribute (config-driven, not URL-based)
    const contentType = document.documentElement.getAttribute('data-content-type');
    const isDocsPage = contentType === 'docs';
    const isBlogPage = contentType === 'blog';
    const isCustomPage = contentType === 'custom';

    // Get current layout from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const currentLayout = urlParams.get('layout');

    // Get current theme
    const currentTheme = localStorage.getItem('theme') || 'system';

    // Create the window using Astro's built-in component
    const windowEl = document.createElement('astro-dev-toolbar-window');

    // Create styles
    const styles = document.createElement('style');
    styles.textContent = `
      .panel-content {
        padding: 12px;
        font-family: system-ui, -apple-system, sans-serif;
        min-width: 260px;
      }

      .section {
        margin-bottom: 16px;
      }

      .section:last-child {
        margin-bottom: 0;
      }

      .section-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .section-title svg {
        width: 12px;
        height: 12px;
        opacity: 0.6;
      }

      .option-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .option-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: rgba(255, 255, 255, 0.9);
        cursor: pointer;
        transition: all 0.15s ease;
        font-size: 13px;
        width: 100%;
        text-align: left;
      }

      .option-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
      }

      .option-btn.active {
        background: rgba(99, 102, 241, 0.2);
        border-color: rgba(99, 102, 241, 0.5);
        color: #a5b4fc;
      }

      .radio-circle {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .option-btn.active .radio-circle {
        border-color: #a5b4fc;
      }

      .radio-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: transparent;
      }

      .option-btn.active .radio-dot {
        background: #a5b4fc;
      }

      .option-text {
        flex: 1;
      }

      .active-tag {
        font-size: 9px;
        padding: 2px 5px;
        background: rgba(99, 102, 241, 0.3);
        border-radius: 3px;
        color: #a5b4fc;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .disabled-msg {
        padding: 10px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 6px;
        color: rgba(255, 255, 255, 0.4);
        font-size: 12px;
        text-align: center;
      }

      .divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
        margin: 12px 0;
      }

      .theme-row {
        display: flex;
        gap: 6px;
      }

      .theme-btn {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 10px 6px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        transition: all 0.15s ease;
        font-size: 10px;
      }

      .theme-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .theme-btn.active {
        background: rgba(99, 102, 241, 0.2);
        border-color: rgba(99, 102, 241, 0.5);
        color: #a5b4fc;
      }

      .theme-btn svg {
        width: 18px;
        height: 18px;
      }
    `;

    // Build content
    let html = '<div class="panel-content">';

    // Layout Section
    html += '<div class="section">';
    html += `<div class="section-title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
      Layout
    </div>`;

    if (isDocsPage) {
      html += '<div class="option-list">';
      for (const layout of LAYOUTS.docs) {
        const isActive = currentLayout === layout || (!currentLayout && layout === 'doc_style1');
        const displayName = layout.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
        html += `
          <button class="option-btn ${isActive ? 'active' : ''}" data-layout="${layout}" data-type="docs">
            <span class="radio-circle"><span class="radio-dot"></span></span>
            <span class="option-text">${displayName}</span>
            ${isActive ? '<span class="active-tag">Active</span>' : ''}
          </button>
        `;
      }
      html += '</div>';
    } else if (isBlogPage) {
      html += '<div class="option-list">';
      for (const layout of LAYOUTS.blog) {
        const isActive = currentLayout === layout || (!currentLayout && layout === 'blog_style1');
        const displayName = layout.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
        html += `
          <button class="option-btn ${isActive ? 'active' : ''}" data-layout="${layout}" data-type="blog">
            <span class="radio-circle"><span class="radio-dot"></span></span>
            <span class="option-text">${displayName}</span>
            ${isActive ? '<span class="active-tag">Active</span>' : ''}
          </button>
        `;
      }
      html += '</div>';
    } else {
      html += '<div class="disabled-msg">Navigate to /docs or /blog to select layouts</div>';
    }
    html += '</div>';

    // Divider
    html += '<div class="divider"></div>';

    // Theme Section
    html += '<div class="section">';
    html += `<div class="section-title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
      </svg>
      Theme
    </div>`;
    html += '<div class="theme-row">';

    const themeData = [
      { id: 'light', label: 'Light', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>` },
      { id: 'dark', label: 'Dark', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>` },
      { id: 'system', label: 'System', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>` },
    ];

    for (const theme of themeData) {
      const isActive = currentTheme === theme.id;
      html += `
        <button class="theme-btn ${isActive ? 'active' : ''}" data-theme="${theme.id}">
          ${theme.icon}
          <span>${theme.label}</span>
        </button>
      `;
    }
    html += '</div>';
    html += '</div>';

    html += '</div>';

    windowEl.innerHTML = html;

    // Add event listeners for layout buttons
    windowEl.querySelectorAll('.option-btn[data-layout]').forEach(button => {
      button.addEventListener('click', () => {
        const layout = button.getAttribute('data-layout');
        const type = button.getAttribute('data-type');

        if (layout) {
          const url = new URL(window.location.href);
          url.searchParams.set('layout', layout);
          localStorage.setItem(`dev-layout-${type}`, layout);
          window.location.href = url.toString();
        }
      });
    });

    // Add event listeners for theme buttons
    windowEl.querySelectorAll('.theme-btn[data-theme]').forEach(button => {
      button.addEventListener('click', () => {
        const theme = button.getAttribute('data-theme');

        if (theme) {
          // Update button states
          windowEl.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
          });

          // Store and apply theme
          localStorage.setItem('theme', theme);

          if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
          } else {
            document.documentElement.setAttribute('data-theme', theme);
          }
        }
      });
    });

    canvas.appendChild(styles);
    canvas.appendChild(windowEl);
  },
};
