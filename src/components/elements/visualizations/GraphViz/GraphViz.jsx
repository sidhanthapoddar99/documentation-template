import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Graphviz } from 'graphviz-react';
import styles from '../CustomMermaid/CustomMermaid.module.css';
import Panzoom from '@panzoom/panzoom';

const GraphViz = ({ value, title, description, engine = 'dot' }) => {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const panzoomRef = useRef(null);
  
  // Use the same zoom functionality from CustomMermaid
  const zoomIntervalRef = useRef(null);
  const isHoldingRef = useRef(false);

  // Monitor when GraphViz renders
  useEffect(() => {
    setIsReady(false);
    setError(null);
    
    // Check for rendered SVG
    const checkForSvg = () => {
      if (!wrapperRef.current) return;
      
      const svgElement = wrapperRef.current.querySelector('svg');
      if (svgElement) {
        // Apply theme colors
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        // Update text colors
        svgElement.querySelectorAll('text').forEach((text) => {
          if (!text.style.fill || text.style.fill === 'black' || text.style.fill === 'rgb(0, 0, 0)') {
            text.style.fill = isDark ? '#ffffff' : '#000000';
          }
        });
        
        // Update edge colors
        svgElement.querySelectorAll('path, polygon').forEach((element) => {
          const stroke = element.getAttribute('stroke');
          if (stroke === 'black' || stroke === '#000000') {
            element.setAttribute('stroke', isDark ? '#ffffff' : '#000000');
          }
          const fill = element.getAttribute('fill');
          if (fill === 'black' || fill === '#000000') {
            element.setAttribute('fill', isDark ? '#ffffff' : '#000000');
          }
        });
        
        // Update node borders
        svgElement.querySelectorAll('ellipse, rect, circle').forEach((element) => {
          const stroke = element.getAttribute('stroke');
          if (stroke === 'black' || stroke === '#000000') {
            element.setAttribute('stroke', isDark ? '#ffffff' : '#000000');
          }
        });
        
        setIsReady(true);
      } else {
        // Retry after a short delay
        setTimeout(checkForSvg, 100);
      }
    };
    
    setTimeout(checkForSvg, 100);
  }, [value]);

  // Theme change detection
  useEffect(() => {
    const handleThemeChange = () => {
      if (isReady && wrapperRef.current) {
        const svgElement = wrapperRef.current.querySelector('svg');
        if (svgElement) {
          const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
          
          // Update colors
          svgElement.querySelectorAll('text').forEach((text) => {
            if (text.style.fill === (isDark ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)')) {
              text.style.fill = isDark ? '#ffffff' : '#000000';
            }
          });
          
          svgElement.querySelectorAll('path, polygon').forEach((element) => {
            const stroke = element.getAttribute('stroke');
            if (stroke === (isDark ? '#000000' : '#ffffff')) {
              element.setAttribute('stroke', isDark ? '#ffffff' : '#000000');
            }
            const fill = element.getAttribute('fill');
            if (fill === (isDark ? '#000000' : '#ffffff')) {
              element.setAttribute('fill', isDark ? '#ffffff' : '#000000');
            }
          });
          
          svgElement.querySelectorAll('ellipse, rect, circle').forEach((element) => {
            const stroke = element.getAttribute('stroke');
            if (stroke === (isDark ? '#000000' : '#ffffff')) {
              element.setAttribute('stroke', isDark ? '#ffffff' : '#000000');
            }
          });
        }
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          handleThemeChange();
        }
      });
    });

    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });
    }

    return () => observer.disconnect();
  }, [isReady]);

  // All the pan/zoom functionality
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
      
      const containerWidth = containerRect.width - 40;
      const containerHeight = containerRect.height - 40;
      
      const scaleX = containerWidth / svgRect.width;
      const scaleY = containerHeight / svgRect.height;
      
      return Math.min(scaleX, scaleY) * 0.95;
    } catch (error) {
      console.warn('Error calculating fit scale:', error);
      return 1;
    }
  }, []);

  const initializePanzoom = useCallback(() => {
    if (!wrapperRef.current || !isReady) return;

    destroyPanzoom();

    const svgElement = wrapperRef.current.querySelector('svg');
    if (!svgElement) return;

    svgElement.style.maxWidth = 'none';
    svgElement.style.maxHeight = 'none';
    svgElement.style.height = 'auto';
    svgElement.style.width = 'auto';
    
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

      setTimeout(() => {
        if (panzoomRef.current) {
          panzoomRef.current.reset();
        }
      }, 100);

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
    }
  }, [isReady, destroyPanzoom, calculateFitScale]);

  useEffect(() => {
    if (isReady) {
      const cleanup = initializePanzoom();
      return () => {
        destroyPanzoom();
        if (cleanup) cleanup();
      };
    }
  }, [isReady, isFullScreen, initializePanzoom, destroyPanzoom]);

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

  // Control handlers
  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);
  const handleReset = () => panzoomRef.current?.reset();
  const handleZoomIn = () => panzoomRef.current?.zoomIn();
  const handleZoomOut = () => panzoomRef.current?.zoomOut();
  const handleMaxZoomOut = () => panzoomRef.current?.zoom(0.01, { animate: true });
  const handleMaxZoomIn = () => panzoomRef.current?.zoom(5, { animate: true });
  
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
    zoomIntervalRef.current = setInterval(zoomStep, 16);
  }, []);

  const stopSmoothZoom = useCallback(() => {
    isHoldingRef.current = false;
    if (zoomIntervalRef.current) {
      clearInterval(zoomIntervalRef.current);
      zoomIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopSmoothZoom();
      destroyPanzoom();
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
        
        <div key={value} ref={wrapperRef} className={styles.mermaidWrapper}>
          {error ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-status-danger)' }}>Error rendering GraphViz diagram:</p>
              <p style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{error}</p>
            </div>
          ) : (
            <Graphviz
              dot={value}
              options={{
                engine,
                fit: true,
                height: '100%',
                width: '100%',
                zoom: false
              }}
              onError={(err) => {
                console.error('GraphViz error:', err);
                setError(err.message || 'Failed to render graph');
              }}
            />
          )}
          {!isReady && !error && (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p>Rendering graph...</p>
            </div>
          )}
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

export default GraphViz;