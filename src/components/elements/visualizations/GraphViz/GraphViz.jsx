import React, { useEffect, useRef, useState, useCallback } from 'react';
import Panzoom from '@panzoom/panzoom';
import styles from '../CustomMermaid/CustomMermaid.module.css';

const GraphViz = ({ value, title, description, options = {}, engine }) => {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [GraphvizComponent, setGraphvizComponent] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const panzoomRef = useRef(null);
  
  // Smooth zoom refs
  const zoomIntervalRef = useRef(null);
  const isHoldingRef = useRef(false);

  // Load Graphviz component dynamically to avoid SSR issues
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('graphviz-react').then(module => {
        setGraphvizComponent(() => module.Graphviz);
      });
    }
  }, []);

  const defaultOptions = {
    fit: true,
    height: 500,
    width: '100%',
    zoom: true, // Enable zoom in graphviz-react
    useWorker: false // Disable worker to have more control
  };

  const mergedOptions = { ...defaultOptions, ...options };

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

  const initializePanzoom = useCallback(() => {
    if (!wrapperRef.current) return;

    destroyPanzoom();

    // Wait a bit for graphviz-react to render
    setTimeout(() => {
      // Find the container div created by graphviz-react
      const graphContainer = wrapperRef.current.querySelector('.graphviz-react-container');
      const svgElement = wrapperRef.current.querySelector('svg');
      
      if (!svgElement) {
        console.warn('SVG element not found in GraphViz component');
        return;
      }

      console.log('Found SVG element:', svgElement);

      // Apply to the SVG element directly
      try {
        panzoomRef.current = Panzoom(svgElement, {
          maxScale: 10,
          minScale: 0.1,
          step: 0.1,
          cursor: 'move',
          canvas: false,
          contain: false,
          panOnlyWhenZoomed: false,
          animate: true,
          duration: 200,
          easing: 'ease-in-out'
        });

        console.log('Panzoom initialized successfully');

        // Add wheel zoom handler
        const handleWheel = (event) => {
          if (!event.ctrlKey && !event.metaKey) return;
          event.preventDefault();
          
          const delta = -event.deltaY;
          const scale = delta > 0 ? 1.1 : 0.9;
          
          if (panzoomRef.current) {
            const currentScale = panzoomRef.current.getScale();
            const newScale = Math.max(0.1, Math.min(10, currentScale * scale));
            panzoomRef.current.zoomToPoint(newScale, event);
          }
        };

        containerRef.current?.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
          containerRef.current?.removeEventListener('wheel', handleWheel);
        };
      } catch (error) {
        console.error('Failed to initialize panzoom:', error);
      }
    }, 500); // Give graphviz-react time to render
  }, [destroyPanzoom]);

  // Apply theme colors
  const applyThemeColors = useCallback(() => {
    if (!wrapperRef.current) return;

    const svgElement = wrapperRef.current.querySelector('svg');
    if (!svgElement) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Make background transparent
    svgElement.style.background = 'transparent';
    
    // Update all black elements to theme colors
    const elements = svgElement.querySelectorAll('*');
    elements.forEach(el => {
      // Text elements
      if (el.tagName === 'text') {
        if (el.getAttribute('fill') === 'black' || !el.getAttribute('fill')) {
          el.setAttribute('fill', isDark ? '#e0e0e0' : '#333333');
        }
      }
      
      // Paths and shapes
      if (['path', 'polygon', 'ellipse', 'rect', 'circle'].includes(el.tagName)) {
        const stroke = el.getAttribute('stroke');
        const fill = el.getAttribute('fill');
        
        if (stroke === 'black' || stroke === '#000000') {
          el.setAttribute('stroke', isDark ? '#888888' : '#555555');
        }
        if (fill === 'black' || fill === '#000000') {
          el.setAttribute('fill', isDark ? '#666666' : '#666666');
        }
      }
    });

    // Remove white background
    const bgElements = svgElement.querySelectorAll('[fill="white"]');
    bgElements.forEach(el => {
      if (el.tagName === 'polygon' || el.tagName === 'rect') {
        el.setAttribute('fill', 'transparent');
      }
    });
  }, []);

  // Initialize everything when GraphViz renders
  useEffect(() => {
    if (!GraphvizComponent || !wrapperRef.current) return;

    // Use MutationObserver to detect when SVG is added
    const observer = new MutationObserver((mutations) => {
      const svg = wrapperRef.current?.querySelector('svg');
      if (svg && !isReady) {
        console.log('SVG detected by MutationObserver');
        setIsReady(true);
        applyThemeColors();
        initializePanzoom();
        observer.disconnect();
      }
    });

    observer.observe(wrapperRef.current, {
      childList: true,
      subtree: true
    });

    // Also check immediately in case it's already rendered
    const svg = wrapperRef.current.querySelector('svg');
    if (svg) {
      console.log('SVG already present');
      setIsReady(true);
      applyThemeColors();
      initializePanzoom();
      observer.disconnect();
    }

    return () => {
      observer.disconnect();
      destroyPanzoom();
    };
  }, [GraphvizComponent, applyThemeColors, initializePanzoom, destroyPanzoom]);

  // Re-apply theme colors when theme changes
  useEffect(() => {
    if (!isReady) return;

    const observer = new MutationObserver(() => {
      applyThemeColors();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, [isReady, applyThemeColors]);

  // Fullscreen handling
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
      // Re-initialize panzoom after fullscreen change
      setTimeout(() => {
        initializePanzoom();
      }, 100);
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullScreen, initializePanzoom]);

  // Control handlers
  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);
  const handleReset = () => panzoomRef.current?.reset();
  const handleZoomIn = () => panzoomRef.current?.zoomIn();
  const handleZoomOut = () => panzoomRef.current?.zoomOut();
  const handleMaxZoomOut = () => panzoomRef.current?.zoom(0.1, { animate: true });
  const handleMaxZoomIn = () => panzoomRef.current?.zoom(5, { animate: true });
  
  const handleFitToContainer = () => {
    if (panzoomRef.current) {
      panzoomRef.current.reset();
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
        
        if ((direction === 'in' && newScale < 10) || (direction === 'out' && newScale > 0.1)) {
          panzoomRef.current.zoom(newScale, { animate: false });
        }
      }
    };
    
    zoomStep();
    zoomIntervalRef.current = setInterval(zoomStep, 16);
  }, []);

  const stopSmoothZoom = useCallback(() => {
    isHoldingRef.current = false;
    if (zoomIntervalRef.current) {
      clearInterval(zoomIntervalRef.current);
      zoomIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSmoothZoom();
      destroyPanzoom();
    };
  }, [stopSmoothZoom, destroyPanzoom]);

  if (!GraphvizComponent) {
    return (
      <div className={styles.diagramWrapper}>
        <div className={styles.diagramContainer}>
          <p>Loading GraphViz...</p>
        </div>
      </div>
    );
  }

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
        <div className={styles.controls}>
          <button className={styles.controlButton} onClick={handleMaxZoomOut} title="Maximum Zoom Out">
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
            title="Zoom Out"
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
            title="Zoom In"
          >
            <img src="/img/viz-icons/zoom-in.svg" alt="Zoom In" />
          </button>

          <button className={styles.controlButton} onClick={handleMaxZoomIn} title="Maximum Zoom In">
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
        
        <div ref={wrapperRef} className={styles.mermaidWrapper} style={{ position: 'relative', overflow: 'hidden' }}>
          <GraphvizComponent 
            dot={value} 
            options={mergedOptions}
            className="graphviz-react-container"
          />
        </div>
        
        {!isFullScreen && (
          <div className={styles.hint}>
            Hold Ctrl/Cmd + scroll to zoom • Drag to pan
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphViz;