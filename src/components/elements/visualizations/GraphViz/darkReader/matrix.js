// Matrix operations for Dark Reader-style color transformations

export class Matrix {
  // Identity matrix (no transformation)
  static identity() {
    return [
      [1, 0, 0, 0, 0],
      [0, 1, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1],
    ];
  }

  // Dark Reader's specific inversion matrix
  static invertNHue() {
    return [
      [0.333, -0.667, -0.667, 0, 1],
      [-0.667, 0.333, -0.667, 0, 1],
      [-0.667, -0.667, 0.333, 0, 1],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1],
    ];
  }

  static brightness(v) {
    return [
      [v, 0, 0, 0, 0],
      [0, v, 0, 0, 0],
      [0, 0, v, 0, 0],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1],
    ];
  }

  static contrast(v) {
    const t = (1 - v) / 2;
    return [
      [v, 0, 0, 0, t],
      [0, v, 0, 0, t],
      [0, 0, v, 0, t],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1],
    ];
  }

  static sepia(v) {
    return [
      [(0.393 + 0.607 * (1 - v)), (0.769 - 0.769 * (1 - v)), (0.189 - 0.189 * (1 - v)), 0, 0],
      [(0.349 - 0.349 * (1 - v)), (0.686 + 0.314 * (1 - v)), (0.168 - 0.168 * (1 - v)), 0, 0],
      [(0.272 - 0.272 * (1 - v)), (0.534 - 0.534 * (1 - v)), (0.131 + 0.869 * (1 - v)), 0, 0],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1],
    ];
  }

  static grayscale(v) {
    return [
      [(0.2126 + 0.7874 * (1 - v)), (0.7152 - 0.7152 * (1 - v)), (0.0722 - 0.0722 * (1 - v)), 0, 0],
      [(0.2126 - 0.2126 * (1 - v)), (0.7152 + 0.2848 * (1 - v)), (0.0722 - 0.0722 * (1 - v)), 0, 0],
      [(0.2126 - 0.2126 * (1 - v)), (0.7152 - 0.7152 * (1 - v)), (0.0722 + 0.9278 * (1 - v)), 0, 0],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1],
    ];
  }
}

// Matrix multiplication helper
export function multiplyMatrices(m1, m2) {
  const result = Array(5).fill().map(() => Array(5).fill(0));
  
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      let sum = 0;
      for (let k = 0; k < 5; k++) {
        sum += m1[i][k] * m2[k][j];
      }
      result[i][j] = sum;
    }
  }
  
  return result;
}

// Convert matrix to SVG filter string
export function toSVGMatrix(matrix) {
  return matrix.slice(0, 4)
    .map((row) => row.map((val) => val.toFixed(3)).join(' '))
    .join(' ');
}