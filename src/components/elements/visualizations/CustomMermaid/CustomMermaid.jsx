import React, { useEffect, useRef, useState, useCallback } from 'react';
import Mermaid from '@theme/Mermaid';
import Panzoom from '@panzoom/panzoom';
import styles from './CustomMermaid.module.css';

const CustomMermaid = ({ value, title, description }) => {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPanzoomError, setHasPanzoomError] = useState(false);
  const panzoomRef = useRef(null);
  const observerRef = useRef(null);
  const retryCountRef = useRef(0);
  const initTimeoutRef = useRef(null);
  
  // Press and hold functionality for smooth zoom
  const zoomIntervalRef = useRef(null);
  const isHoldingRef = useRef(false);
  
  // Track if component is mounted
  const isMountedRef = useRef(true);

  const destroyPanzoom = useCallback(() => {
    if (panzoomRef.current) {
      try {
        panzoomRef.current.destroy();
      } catch (error) {
        console.warn('Error destroying panzoom:', error);
      }
      panzoomRef.current = null;
    }
  }, []);

  const calculateFitScale = useCallback((svgElement, container) => {
    if (!svgElement || !container) return 1;
    
    try {
      const svgRect = svgElement.getBBox();
      const containerRect = container.getBoundingClientRect();
      
      // Account for padding
      const containerWidth = containerRect.width - 40;
      const containerHeight = containerRect.height - 40;
      
      const scaleX = containerWidth / svgRect.width;
      const scaleY = containerHeight / svgRect.height;
      
      return Math.min(scaleX, scaleY) * 0.95; // 95% of fit scale for some breathing room
    } catch (error) {
      console.warn('Error calculating fit scale:', error);
      return 1;
    }
  }, []);

  // Debounced initialization
  const debouncedInitRef = useRef(null);
  
  const initializePanzoom = useCallback(() => {
    if (!wrapperRef.current || !isReady) return;
    
    // Clear any pending initialization
    if (debouncedInitRef.current) {
      clearTimeout(debouncedInitRef.current);
    }
    
    // Debounce initialization to prevent rapid re-init
    debouncedInitRef.current = setTimeout(() => {
      destroyPanzoom();

    const svgElement = wrapperRef.current.querySelector('svg');
    if (!svgElement) return;

    // Remove overflow hidden from all Mermaid containers
    const mermaidContainers = wrapperRef.current.querySelectorAll('[style*="overflow"], .docusaurus-mermaid-container, .mermaid');
    mermaidContainers.forEach((container) => {
      if (container && container.style) {
        container.style.overflow = 'visible';
        if (container.classList && container.classList.contains('docusaurus-mermaid-container')) {
          container.style.width = '100%';
          container.style.height = '100%';
          container.style.maxWidth = '100%';
          container.style.maxHeight = '100%';
          container.style.display = 'flex';
          container.style.alignItems = 'center';
          container.style.justifyContent = 'center';
        }
      }
    });
    
    // Ensure the SVG is properly positioned
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Reset SVG styles
    svgElement.style.maxWidth = 'none';
    svgElement.style.maxHeight = 'none';
    svgElement.style.height = 'auto';
    svgElement.style.width = 'auto';
    
    // Calculate fit scale
    const fitScale = calculateFitScale(svgElement, wrapperRef.current);

    try {
      panzoomRef.current = Panzoom(svgElement, {
        maxScale: 10,
        minScale: 0.1,
        step: 0.1,
        startScale: fitScale * 0.9,
        cursor: 'move',
        canvas: true,
        contain: false,
        panOnlyWhenZoomed: false,
        bounds: false,
        boundsPadding: 0,
        smoothTime: 300,
        disablePan: false,
        disableZoom: false,
        duration: 200,
        easing: 'ease-in-out'
      });

      // Center the diagram
      setTimeout(() => {
        if (panzoomRef.current) {
          panzoomRef.current.reset();
        }
      }, 100);

      // Add wheel zoom
      const handleWheel = (event) => {
        if (!event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        event.stopPropagation();
        
        const delta = event.deltaY;
        const scale = delta > 0 ? 0.9 : 1.1;
        
        if (panzoomRef.current) {
          const currentScale = panzoomRef.current.getScale();
          let newScale = currentScale * scale;
          newScale = Math.max(0.01, Math.min(15, newScale));
          
          panzoomRef.current.zoom(newScale, { 
            animate: false,
            focal: { x: event.clientX, y: event.clientY }
          });
        }
      };

      const currentContainer = containerRef.current;
      if (currentContainer) {
        currentContainer.addEventListener('wheel', handleWheel, { passive: false });
      }

      return () => {
        if (currentContainer) {
          currentContainer.removeEventListener('wheel', handleWheel);
        }
      };
    } catch (error) {
      console.warn('Failed to initialize panzoom:', error);
      setHasPanzoomError(true);
    }
    }, 50); // 50ms debounce
  }, [isReady, destroyPanzoom, calculateFitScale]);

  // Wait for Mermaid to render using MutationObserver
  const waitForMermaidRender = useCallback(() => {
    if (!wrapperRef.current) return;
    
    setIsLoading(true);
    setIsReady(false);
    retryCountRef.current = 0;
    
    // Clear any existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Clear any existing timeout
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }
    
    const checkForSvg = () => {
      // Look for both the SVG element and the Mermaid container
      const container = wrapperRef.current?.querySelector('.docusaurus-mermaid-container');
      const svgElement = wrapperRef.current?.querySelector('svg');
      
      // Check for error messages from Mermaid
      const errorElement = wrapperRef.current?.querySelector('.error-icon');
      if (errorElement) {
        console.error('Mermaid rendering error detected');
        setIsLoading(false);
        setIsReady(false);
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
        return true; // Stop retrying if there's an error
      }
      
      // If container exists but no SVG yet, Mermaid is still processing
      if (container && !svgElement) {
        return false;
      }
      
      if (svgElement) {
        try {
          // For Mermaid diagrams, just check if the SVG exists and has a viewBox
          // Mermaid sets viewBox when rendering is complete
          const hasViewBox = svgElement.hasAttribute('viewBox');
          const hasChildren = svgElement.children.length > 0;
          
          // Also check if it's an inline SVG (not an error message)
          const isValidSvg = svgElement.tagName.toLowerCase() === 'svg' && 
                            !svgElement.classList.contains('error');
          
          if ((hasViewBox || hasChildren) && isValidSvg) {
            if (isMountedRef.current) {
              setIsLoading(false);
              setIsReady(true);
            }
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
            return true;
          }
        } catch (error) {
          // Ignore errors during checks
          console.debug('SVG check error (will retry):', error);
        }
      }
      
      return false;
    };
    
    // Try immediately
    if (checkForSvg()) return;
    
    // Set up MutationObserver to watch for SVG
    observerRef.current = new MutationObserver((mutations) => {
      // Check if any nodes were added
      const hasAddedNodes = mutations.some(mutation => 
        mutation.type === 'childList' && mutation.addedNodes.length > 0
      );
      
      if (hasAddedNodes || mutations.length > 0) {
        if (checkForSvg()) {
          observerRef.current.disconnect();
        }
      }
    });
    
    observerRef.current.observe(wrapperRef.current, {
      childList: true,
      subtree: true,
      attributes: false  // Don't watch attributes to reduce noise
    });
    
    // Fallback timeout with retry logic
    const retryWithBackoff = () => {
      if (retryCountRef.current >= 20) { // Increased from 10 to 20
        console.warn('Mermaid diagram failed to render after maximum retries');
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsReady(false);
        }
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
        return;
      }
      
      if (!checkForSvg()) {
        retryCountRef.current++;
        // Slower backoff for Mermaid
        const delay = Math.min(200 * Math.pow(1.2, retryCountRef.current), 5000);
        initTimeoutRef.current = setTimeout(retryWithBackoff, delay);
      }
    };
    
    // Start retry timer with longer initial delay
    initTimeoutRef.current = setTimeout(retryWithBackoff, 300);
  }, []);
  
  // Trigger render wait when value changes
  useEffect(() => {
    setHasPanzoomError(false); // Reset error state
    waitForMermaidRender();
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [value, waitForMermaidRender]);

  // Initialize panzoom when ready
  useEffect(() => {
    if (isReady) {
      const cleanup = initializePanzoom();
      return () => {
        destroyPanzoom();
        if (cleanup) cleanup();
      };
    }
  }, [isReady, initializePanzoom, destroyPanzoom, isFullScreen]);

  // Fullscreen handling
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(initializePanzoom, 100);
      return () => {
        document.body.style.overflow = '';
        clearTimeout(timer);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isFullScreen, initializePanzoom]);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleReset = () => {
    if (panzoomRef.current) {
      panzoomRef.current.reset();
    }
  };

  const handleZoomIn = () => {
    if (panzoomRef.current) {
      panzoomRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (panzoomRef.current) {
      panzoomRef.current.zoomOut();
    }
  };

  const handleMaxZoomOut = () => {
    if (panzoomRef.current) {
      panzoomRef.current.zoom(0.01, { animate: true });
    }
  };

  const handleMaxZoomIn = () => {
    if (panzoomRef.current) {
      panzoomRef.current.zoom(5, { animate: true });
    }
  };

  const handleFitToContainer = () => {
    if (panzoomRef.current && wrapperRef.current) {
      const svgElement = wrapperRef.current.querySelector('svg');
      if (svgElement) {
        const fitScale = calculateFitScale(svgElement, wrapperRef.current);
        panzoomRef.current.zoom(fitScale * 0.9, { animate: true });
        panzoomRef.current.pan(0, 0, { animate: true });
      }
    }
  };

  // Smooth zoom functionality
  const startSmoothZoom = useCallback((direction) => {
    if (!panzoomRef.current || isHoldingRef.current) return;
    
    isHoldingRef.current = true;
    
    const zoomFactor = direction === 'in' ? 1.02 : 0.98;
    const zoomStep = () => {
      if (panzoomRef.current && isHoldingRef.current) {
        const currentScale = panzoomRef.current.getScale();
        const newScale = currentScale * zoomFactor;
        
        if ((direction === 'in' && newScale < 15) || (direction === 'out' && newScale > 0.01)) {
          panzoomRef.current.zoom(newScale, { animate: false });
        }
      }
    };
    
    zoomStep();
    zoomIntervalRef.current = setInterval(zoomStep, 16); // ~60fps
  }, []);

  const stopSmoothZoom = useCallback(() => {
    isHoldingRef.current = false;
    if (zoomIntervalRef.current) {
      clearInterval(zoomIntervalRef.current);
      zoomIntervalRef.current = null;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopSmoothZoom();
      destroyPanzoom();
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      if (debouncedInitRef.current) {
        clearTimeout(debouncedInitRef.current);
      }
    };
  }, [stopSmoothZoom, destroyPanzoom]);

  return (
    <div className={styles.diagramWrapper}>
      {(title || description) && (
        <div className={styles.diagramHeader}>
          {title && <h4 className={styles.diagramTitle}>{title}</h4>}
          {description && <p className={styles.diagramDescription}>{description}</p>}
        </div>
      )}
      <div
        ref={containerRef}
        className={`${styles.diagramContainer} ${isFullScreen ? styles.fullScreen : ''}`}
      >
        {!hasPanzoomError && (
          <div className={styles.controls}>
            <button className={styles.controlButton} onClick={handleMaxZoomOut} title="Maximum Zoom Out (Bird's Eye View)">
            <img src="/img/viz-icons/zoom-out-max.svg" alt="Zoom Out Max" />
          </button>
          
          <button 
            className={styles.controlButton} 
            onClick={handleZoomOut} 
            onMouseDown={() => startSmoothZoom('out')}
            onMouseUp={stopSmoothZoom}
            onMouseLeave={stopSmoothZoom}
            onTouchStart={() => startSmoothZoom('out')}
            onTouchEnd={stopSmoothZoom}
            title="Zoom Out (Hold for smooth zoom)"
          >
            <img src="/img/viz-icons/zoom-out.svg" alt="Zoom Out" />
          </button>
          
          <button 
            className={styles.controlButton} 
            onClick={handleZoomIn} 
            onMouseDown={() => startSmoothZoom('in')}
            onMouseUp={stopSmoothZoom}
            onMouseLeave={stopSmoothZoom}
            onTouchStart={() => startSmoothZoom('in')}
            onTouchEnd={stopSmoothZoom}
            title="Zoom In (Hold for smooth zoom)"
          >
            <img src="/img/viz-icons/zoom-in.svg" alt="Zoom In" />
          </button>

          <button className={styles.controlButton} onClick={handleMaxZoomIn} title="Maximum Zoom In (Detail View)">
            <img src="/img/viz-icons/zoom-in-max.svg" alt="Zoom In Max" />
          </button>

          <button className={styles.controlButton} onClick={handleFitToContainer} title="Fit to Container">
            <img src="/img/viz-icons/fit-to-container.svg" alt="Fit to Container" />
          </button>

          <button className={styles.controlButton} onClick={handleReset} title="Reset View">
            <img src="/img/viz-icons/reset.svg" alt="Reset" />
          </button>

          <button className={styles.controlButton} onClick={toggleFullScreen} title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}>
            <img src={isFullScreen ? "/img/viz-icons/exit-fullscreen.svg" : "/img/viz-icons/fullscreen.svg"} alt={isFullScreen ? 'Exit Full Screen' : 'Full Screen'} />
          </button>
          </div>
        )}
        
        <div ref={wrapperRef} className={styles.mermaidWrapper}>
          {isLoading && (
            <div className={styles.loadingOverlay}>
              <div className={styles.loadingSpinner}>Loading diagram...</div>
            </div>
          )}
          <Mermaid value={value} />
        </div>
        
        {!isFullScreen && (
          <div className={styles.hint}>
            Hold Ctrl/Cmd + scroll to zoom • Drag to pan • Hold zoom buttons for smooth zoom
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomMermaid;