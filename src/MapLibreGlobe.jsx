import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const SKINS = {
  default: 'satellite',
  dark: 'dataviz-dark',
  day: 'outdoor-v2',
  water: 'ocean',
  night: 'toner-v2',
};

export default forwardRef(function MapLibreGlobe({ onGuess, theme = 'default', showBorders = false, showNames = false }, ref) {
  const mapContainer = useRef(null);
  const skyContainer = useRef(null);
  const map = useRef(null);
  const active = useRef(false);
  const guessMarkerRef = useRef(null);
  const stationMarkerRef = useRef(null);
  
  const onGuessRef = useRef(onGuess);
  useEffect(() => {
    onGuessRef.current = onGuess;
  }, [onGuess]);

  const createMarker = (color, label, lat, lng) => {
    const el = document.createElement('div');
    el.innerHTML = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; pointer-events: auto;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: ${color}; opacity: 0.5; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite; pointer-events: none;"></div>
        <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${color}; border: 2px solid #000; box-shadow: 2px 2px 0px rgba(0,0,0,1); position: relative; z-index: 1;"></div>
        <div style="position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); white-space: nowrap; background: #ffffff; border: 2px solid #000; color: #000; padding: 4px 10px; font-weight: 700; font-family: 'Space Grotesk', system-ui, sans-serif; font-size: 12px; box-shadow: 3px 3px 0px #000; pointer-events: none;">
          ${label}
        </div>
      </div>
    `;
    const clampedLat = Math.max(-89.9, Math.min(89.9, lat));
    return new maplibregl.Marker({ element: el })
      .setLngLat([lng, clampedLat])
      .addTo(map.current);
  };

  const animationRef = useRef(null);

  useEffect(() => {
    if (map.current) return;
    const token = import.meta.env.VITE_MAPTILER_TOKEN;
    if (!token) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/${SKINS[theme] || SKINS.default}/style.json?key=${token}`,
      center: [0, 20],
      zoom: 1.5,
      projection: 'globe',
      renderWorldCopies: false,
      interactive: true,
      maxZoom: 14,
      dragPitch: false,
    });

    map.current.on('style.load', () => {
      map.current.setProjection({ type: 'globe' });
      updateLayers();

      // Only start the rotation loop if it hasn't been started yet (style.load fires again on theme change)
      if (!animationRef.current) {
        const rotateCamera = () => {
          if (!active.current && map.current && !map.current.isZooming() && !map.current.isDragging()) {
            const center = map.current.getCenter();
            center.lng -= 0.1; 
            map.current.jumpTo({ center, zoom: map.current.getZoom() });
          }
          animationRef.current = requestAnimationFrame(rotateCamera);
        };
        rotateCamera();
      }
    });

    map.current.on('move', () => {
      if (!skyContainer.current || !map.current) return;
      const center = map.current.getCenter();
      const bearing = map.current.getBearing();
      skyContainer.current.style.transform = `translate(${(-center.lng % 360) * 0.5}px, ${(-center.lat) * 0.5}px) rotate(${-bearing}deg)`;
    });

    map.current.on('click', (e) => {
      if (!active.current || !map.current) return;
      
      const lngLat = e.lngLat;
      if (!lngLat) return;
      
      const { lng, lat } = lngLat;
      
      if (guessMarkerRef.current) guessMarkerRef.current.remove();
      guessMarkerRef.current = createMarker('#ff5252', 'Your Guess', lat, lng);
      
      onGuessRef.current({ lat, lng });
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      const token = import.meta.env.VITE_MAPTILER_TOKEN;
      if (token) {
        map.current.setStyle(`https://api.maptiler.com/maps/${SKINS[theme] || SKINS.default}/style.json?key=${token}`);
      }
    }
  }, [theme]);

  const updateLayers = () => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    const layers = map.current.getStyle().layers;
    layers.forEach(layer => {
      if (layer.type === 'background') {
        map.current.setPaintProperty(layer.id, 'background-opacity', 0);
      }
      if (layer.id.includes('boundary') || layer['source-layer'] === 'boundary') {
        map.current.setLayoutProperty(layer.id, 'visibility', showBorders ? 'visible' : 'none');
      }
      if (layer.id.includes('place') || layer['source-layer'] === 'place') {
        map.current.setLayoutProperty(layer.id, 'visibility', showNames ? 'visible' : 'none');
      }
    });
  };

  useEffect(() => {
    updateLayers();
  }, [showBorders, showNames]);

  useImperativeHandle(ref, () => ({
    setGuessing(on) {
      active.current = on;
      if (map.current) {
        // Apply cursor correctly to the MapLibre canvas
        map.current.getCanvas().style.cursor = on ? 'crosshair' : 'grab';
      }
    },
    reveal(aLat, aLng, gLat, gLng) {
      if (!map.current) return;
      
      if (stationMarkerRef.current) stationMarkerRef.current.remove();
      stationMarkerRef.current = createMarker('#69f0ae', 'Radio Station', aLat, aLng);

      const lineId = 'guess-line';
      if (!map.current.getSource(lineId)) {
        map.current.addSource(lineId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[gLng, gLat], [aLng, aLat]]
            }
          }
        });
        map.current.addLayer({
          id: lineId,
          type: 'line',
          source: lineId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#ff5252', 'line-width': 3, 'line-dasharray': [2, 2] }
        });
      }

      setTimeout(() => {
        map.current.flyTo({ center: [aLng, aLat], zoom: 4, pitch: 0, speed: 0.8, essential: true });
      }, 400);
    },
    reset() {
      active.current = false;
      if (guessMarkerRef.current) guessMarkerRef.current.remove();
      if (stationMarkerRef.current) stationMarkerRef.current.remove();
      guessMarkerRef.current = null;
      stationMarkerRef.current = null;
      
      if (map.current) {
        if (map.current.getLayer('guess-line')) map.current.removeLayer('guess-line');
        if (map.current.getSource('guess-line')) map.current.removeSource('guess-line');

        map.current.flyTo({ center: [0, 20], zoom: 1.5, pitch: 0, speed: 1.2, essential: true });
        map.current.getCanvas().style.cursor = 'grab';
      }
    },
  }));

  return (
    <div className="absolute inset-0 z-[1] maplibre-globe-container overflow-hidden bg-black">
        <style>{`
            .maplibregl-control-container { display: none; }
        `}</style>
        {/* Massive Skybox container to prevent tiling lines, panned via CSS transforms */}
        <div 
          ref={skyContainer} 
          className="absolute z-0" 
          style={{ 
            width: '200vw',
            height: '200vh',
            left: '-50vw',
            top: '-50vh',
            backgroundImage: 'url(https://unpkg.com/three-globe/example/img/night-sky.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            willChange: 'transform'
          }} 
        />
        {/* Map Container */}
        <div ref={mapContainer} className="absolute inset-0 w-full h-full z-10" />
    </div>
  );
});
