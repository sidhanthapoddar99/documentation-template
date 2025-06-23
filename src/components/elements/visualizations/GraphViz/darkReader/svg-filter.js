// SVG Filter creation for Dark Reader-style transformations

import { Matrix, multiplyMatrices, toSVGMatrix } from './matrix';

export function createFilterMatrix(config) {
  let m = Matrix.identity();
  
  // Apply transformations in order
  if (config.sepia !== 0) {
    m = multiplyMatrices(m, Matrix.sepia(config.sepia / 100));
  }
  if (config.grayscale !== 0) {
    m = multiplyMatrices(m, Matrix.grayscale(config.grayscale / 100));
  }
  if (config.contrast !== 100) {
    m = multiplyMatrices(m, Matrix.contrast(config.contrast / 100));
  }
  if (config.brightness !== 100) {
    m = multiplyMatrices(m, Matrix.brightness(config.brightness / 100));
  }
  if (config.mode === 1) {
    m = multiplyMatrices(m, Matrix.invertNHue());
  }
  
  return m;
}

export function getSVGFilterMatrixValue(config) {
  return toSVGMatrix(createFilterMatrix(config));
}

export function getSVGReverseFilterMatrixValue() {
  return toSVGMatrix(Matrix.invertNHue());
}