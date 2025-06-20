const colors = {
  // Main colors
  main: {
    dark: "#000000",
    light: "#FFFFFF"
  },
  
  // Background colors
  background: {
    primary: {
      light: "#FFFFFF",
      dark: "#000000"
    },
    secondary: {
      light: "#fafafa",
      dark: "#000000"
    },
    surface: {
      light: "#f8f9fa",
      dark: "#000000"
    },
    elevated: {
      light: "#FFFFFF",
      dark: "#000000"
    }
  },
  
  // Text colors
  text: {
    primary: {
      light: "#1a1a1a",
      dark: "#FFFFFF"
    },
    secondary: {
      light: "#4a5568",
      dark: "#a0aec0"
    },
    muted: {
      light: "#718096",
      dark: "#718096"
    },
    heading: {
      light: "#000000",
      dark: "#FFFFFF"
    }
  },
  
  // Brand colors
  brand: {
    primary: "#1E63EA",
    primaryHover: "#1652c7",
    secondary: "#6c757d",
    secondaryHover: "#5a6268"
  },
  
  // Status colors
  status: {
    success: "#38a169",
    successLight: "#48bb78",
    warning: "#d69e2e",
    warningLight: "#f6ad55",
    danger: "#e53e3e",
    dangerLight: "#fc8181",
    info: "#3182ce",
    infoLight: "#63b3ed"
  },
  
  // Gray scale
  gray: {
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    300: "#d4d4d8",
    400: "#a1a1aa",
    500: "#71717a",
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
    950: "#0a0a0a"
  },
  
  // Component specific colors
  components: {
    card: {
      background: {
        light: "#FFFFFF",
        dark: "#000000"
      },
      border: {
        light: "#000000",
        dark: "#FFFFFF"
      },
      hover: {
        light: "#f8fafc",
        dark: "#000000"
      }
    },
    button: {
      primary: {
        background: "#1E63EA",
        text: "#FFFFFF",
        hover: "#1652c7",
        active: "#1447a3"
      },
      secondary: {
        background: {
          light: "#e2e8f0",
          dark: "#334155"
        },
        text: {
          light: "#1a1a1a",
          dark: "#FFFFFF"
        },
        hover: {
          light: "#cbd5e1",
          dark: "#475569"
        }
      }
    },
    code: {
      background: {
        light: "#f8f9fa",
        dark: "#000000"
      },
      text: {
        light: "#e53e3e",
        dark: "#f472b6"
      },
      border: {
        light: "#e2e8f0",
        dark: "#FFFFFF"
      }
    },
    callout: {
      info: {
        background: {
          light: "#dbeafe",
          dark: "#1e3a8a"
        },
        border: {
          light: "#3182ce",
          dark: "#3b82f6"
        },
        text: {
          light: "#1e40af",
          dark: "#93bbfc"
        }
      },
      warning: {
        background: {
          light: "#fef3c7",
          dark: "#7c2d12"
        },
        border: {
          light: "#d69e2e",
          dark: "#f59e0b"
        },
        text: {
          light: "#92400e",
          dark: "#fde68a"
        }
      },
      success: {
        background: {
          light: "#d1fae5",
          dark: "#065f46"
        },
        border: {
          light: "#38a169",
          dark: "#10b981"
        },
        text: {
          light: "#065f46",
          dark: "#86efac"
        }
      },
      danger: {
        background: {
          light: "#fee2e2",
          dark: "#7f1d1d"
        },
        border: {
          light: "#e53e3e",
          dark: "#ef4444"
        },
        text: {
          light: "#991b1b",
          dark: "#fecaca"
        }
      }
    }
  },
  
  // Border colors
  border: {
    default: {
      light: "#e2e8f0",
      dark: "#334155"
    },
    subtle: {
      light: "#f1f5f9",
      dark: "#1e293b"
    },
    strong: {
      light: "#cbd5e1",
      dark: "#475569"
    }
  },
  
  // Shadow colors (for box-shadows)
  shadow: {
    light: "rgba(0, 0, 0, 0.05)",
    medium: "rgba(0, 0, 0, 0.1)",
    dark: "rgba(0, 0, 0, 0.2)"
  },
  
  // Icon filters for SVG images
  iconFilter: {
    light: "none",        // Keep black icons in light mode
    dark: "invert(1)"     // Invert to white in dark mode
  }
};

module.exports = { colors };