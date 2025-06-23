// SVG Inverter for Dark Reader-style color transformations

import { getSVGFilterMatrixValue, getSVGReverseFilterMatrixValue } from './svg-filter';

export class SVGInverter {
  constructor(theme) {
    this.SVG_NS = 'http://www.w3.org/2000/svg';
    this.theme = theme;
    this.filterElement = null;
    this.filterId = 'graphviz-dark-filter-' + Math.random().toString(36).substr(2, 9);
    this.reverseFilterId = 'graphviz-dark-reverse-filter-' + Math.random().toString(36).substr(2, 9);
  }

  // Create the SVG filter element
  createSVGFilter() {
    const svg = document.createElementNS(this.SVG_NS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.style.visibility = 'hidden';
    
    // Main filter
    const filter = document.createElementNS(this.SVG_NS, 'filter');
    filter.id = this.filterId;
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    
    const colorMatrix = document.createElementNS(this.SVG_NS, 'feColorMatrix');
    colorMatrix.setAttribute('type', 'matrix');
    colorMatrix.setAttribute('values', getSVGFilterMatrixValue(this.theme));
    
    filter.appendChild(colorMatrix);
    
    // Reverse filter for doubly-inverted elements
    const reverseFilter = document.createElementNS(this.SVG_NS, 'filter');
    reverseFilter.id = this.reverseFilterId;
    reverseFilter.setAttribute('color-interpolation-filters', 'sRGB');
    
    const reverseColorMatrix = document.createElementNS(this.SVG_NS, 'feColorMatrix');
    reverseColorMatrix.setAttribute('type', 'matrix');
    reverseColorMatrix.setAttribute('values', getSVGReverseFilterMatrixValue());
    
    reverseFilter.appendChild(reverseColorMatrix);
    
    svg.appendChild(filter);
    svg.appendChild(reverseFilter);
    
    return svg;
  }

  // Apply inversion to a GraphViz SVG
  invertSVG(svgElement) {
    // Inject filter if not exists
    if (!this.filterElement) {
      this.filterElement = this.createSVGFilter();
      svgElement.parentNode.insertBefore(this.filterElement, svgElement);
    }

    // Apply main filter to root SVG
    svgElement.style.filter = `url(#${this.filterId})`;

    // Handle specific GraphViz elements
    this.processGraphVizElements(svgElement);
  }

  processGraphVizElements(svg) {
    // Background polygons (usually white) - make transparent
    const bgPolygons = svg.querySelectorAll('polygon[fill="white"], polygon[fill="#ffffff"], polygon[fill="#FFFFFF"]');
    bgPolygons.forEach((poly) => {
      // Check if it's likely a background element
      try {
        const bbox = poly.getBBox();
        if (bbox.width > 100 && bbox.height > 100) {
          poly.setAttribute('fill', 'transparent');
        }
      } catch (e) {
        // If getBBox fails, check by position (first polygon is often background)
        if (poly === svg.querySelector('polygon')) {
          poly.setAttribute('fill', 'transparent');
        }
      }
    });

    // Text elements need special handling to maintain readability
    const textElements = svg.querySelectorAll('text');
    textElements.forEach((text) => {
      // Apply reverse filter to maintain readability
      text.style.filter = `url(#${this.reverseFilterId})`;
    });

    // Handle image elements within nodes
    const images = svg.querySelectorAll('image');
    images.forEach((img) => {
      // Double-invert images to restore original colors
      img.style.filter = `url(#${this.reverseFilterId})`;
    });

    // Handle specific fills that should be transparent
    const transparentFills = svg.querySelectorAll('rect[fill="white"], rect[fill="#ffffff"], rect[fill="#FFFFFF"]');
    transparentFills.forEach((rect) => {
      try {
        const bbox = rect.getBBox();
        // Large rectangles are likely backgrounds
        if (bbox.width > 200 && bbox.height > 200) {
          rect.setAttribute('fill', 'transparent');
        }
      } catch (e) {
        // Fallback
        rect.setAttribute('fill', 'transparent');
      }
    });

    // Edge cases for specific GraphViz patterns
    this.handleGraphVizPatterns(svg);
  }

  handleGraphVizPatterns(svg) {
    // Gradient fills
    const gradients = svg.querySelectorAll('linearGradient, radialGradient');
    gradients.forEach((gradient) => {
      gradient.style.filter = `url(#${this.filterId})`;
    });

    // Pattern fills
    const patterns = svg.querySelectorAll('pattern');
    patterns.forEach((pattern) => {
      // Apply filter to pattern content
      pattern.style.filter = `url(#${this.filterId})`;
    });

    // Markers (arrows)
    const markers = svg.querySelectorAll('marker');
    markers.forEach((marker) => {
      // Markers inherit the filter from their parent path
      const paths = marker.querySelectorAll('path, polygon');
      paths.forEach((path) => {
        // Ensure arrows are visible in dark mode
        const fill = path.getAttribute('fill');
        if (fill === 'black' || fill === '#000000') {
          path.style.filter = 'none'; // Let parent filter handle it
        }
      });
    });
  }

  // Remove inversion
  removeSVG(svgElement) {
    // Remove filter from SVG
    svgElement.style.filter = '';
    
    // Remove all inline filters
    const filtered = svgElement.querySelectorAll('[style*="filter"]');
    filtered.forEach((el) => {
      el.style.filter = '';
    });
    
    // Restore original fills
    const transparentElements = svgElement.querySelectorAll('[fill="transparent"]');
    transparentElements.forEach((el) => {
      if (el.tagName === 'polygon' || el.tagName === 'rect') {
        el.setAttribute('fill', 'white');
      }
    });
  }

  // Update theme dynamically
  updateTheme(newTheme) {
    this.theme = newTheme;
    
    if (this.filterElement) {
      const colorMatrix = this.filterElement.querySelector(`#${this.filterId} feColorMatrix`);
      if (colorMatrix) {
        colorMatrix.setAttribute('values', getSVGFilterMatrixValue(this.theme));
      }
    }
  }

  // Clean up
  destroy() {
    if (this.filterElement) {
      this.filterElement.remove();
      this.filterElement = null;
    }
  }
}