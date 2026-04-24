import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import Globe from 'globe.gl';

const BUMP = 'https://unpkg.com/three-globe/example/img/earth-topology.png';
const SKY = 'https://unpkg.com/three-globe/example/img/night-sky.png';

const SKINS = {
  default: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
  dark: 'https://unpkg.com/three-globe/example/img/earth-dark.jpg',
  day: 'https://unpkg.com/three-globe/example/img/earth-day.jpg',
  water: 'https://unpkg.com/three-globe/example/img/earth-water.png',
  night: 'https://unpkg.com/three-globe/example/img/earth-night.jpg',
};

export default forwardRef(function GlobeView({ onGuess, theme = 'default', showBorders = false, showNames = false }, ref) {
  const el = useRef(null);
  const g = useRef(null);
  const active = useRef(false);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => setCountries(data.features))
      .catch(err => console.error("Error loading countries data", err));
  }, []);

  useEffect(() => {
    const globe = Globe()
      .globeImageUrl(SKINS[theme] || SKINS.default).bumpImageUrl(BUMP).backgroundImageUrl(SKY)
      .showAtmosphere(true).atmosphereColor('#4fc3f7').atmosphereAltitude(0.18)
      .width(window.innerWidth).height(window.innerHeight)(el.current);

    globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
    Object.assign(globe.controls(), {
      autoRotate: true, autoRotateSpeed: 0.4,
      enableDamping: true, dampingFactor: 0.08,
      minDistance: 140, maxDistance: 600,
    });

    const createMarker = (color, label) => {
      const root = document.createElement('div');
      Object.assign(root.style, {
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      });
      root.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; pointer-events: auto;">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: ${color}; opacity: 0.5; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite; pointer-events: none;"></div>
          <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${color}; border: 2px solid #000; box-shadow: 2px 2px 0px rgba(0,0,0,1); position: relative; z-index: 1;"></div>
          <div style="position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); white-space: nowrap; background: #fdfdfd; border: 2px solid #000; color: #000; padding: 2px 10px; font-weight: 700; font-size: 12px; box-shadow: 3px 3px 0px rgba(0,0,0,1); border-radius: 3px; pointer-events: none;">
            ${label}
          </div>
        </div>
      `;
      return root;
    };
    globe._createMarker = createMarker;

    globe.onGlobeClick(({ lat, lng }) => {
      if (!active.current) return;
      globe.htmlElementsData([{ lat, lng, c: '#ff5252', l: 'Your Guess' }])
        .htmlElement(d => globe._createMarker(d.c, d.l));
      onGuess({ lat, lng });
    });

    window.addEventListener('resize', () =>
      globe.width(window.innerWidth).height(window.innerHeight));
    g.current = globe;
  }, []); // eslint-disable-line

  useEffect(() => {
    if (g.current) {
      g.current.globeImageUrl(SKINS[theme] || SKINS.default);
    }
  }, [theme]);

  // Update polygons whenever showBorders, showNames or countries data changes
  useEffect(() => {
    if (g.current && countries.length > 0) {
      if (showBorders || showNames) {
        g.current.polygonsData(countries)
          .polygonAltitude(0.005)
          .polygonCapColor(() => 'rgba(255, 255, 255, 0)') // Transparent fill
          .polygonSideColor(() => 'rgba(81, 159, 255, 1)')
          .polygonStrokeColor(() => showBorders ? 'rgba(124, 173, 247, 1)' : 'rgba(0,0,0,0)')
          .polygonLabel(d => showNames ? `<div style="background: white; border: 2px solid black; color: black; padding: 6px 10px; font-weight: 800; font-family: system-ui, -apple-system, sans-serif; font-size: 12px; pointer-events: none;">${d.properties.NAME}</div>` : null)
          .onPolygonClick((polygon, event, { lat, lng }) => {
            if (!active.current) return;
            g.current.htmlElementsData([{ lat, lng, c: '#ff5252', l: 'Your Guess' }])
              .htmlElement(d => g.current._createMarker(d.c, d.l));
            onGuess({ lat, lng });
          });
      } else {
        g.current.polygonsData([]);
      }
    }
  }, [showBorders, showNames, countries]);

  useImperativeHandle(ref, () => ({
    setGuessing(on) {
      active.current = on;
      if (g.current) {
        g.current.controls().autoRotate = !on;
        el.current.style.cursor = on ? 'crosshair' : 'grab';
      }
    },
    reveal(aLat, aLng, gLat, gLng) {
      if (!g.current) return;
      g.current
        .htmlElementsData([
          { lat: gLat, lng: gLng, c: '#ff5252', l: 'Your Guess' },
          { lat: aLat, lng: aLng, c: '#69f0ae', l: 'Radio Station' },
        ])
        .htmlElement(d => g.current._createMarker(d.c, d.l));
      g.current
        .arcsData([{ startLat: gLat, startLng: gLng, endLat: aLat, endLng: aLng }])
        .arcColor(() => ['#ff5252', '#69f0ae'])
        .arcDashLength(0.4).arcDashGap(0.15).arcDashAnimateTime(2000)
        .arcStroke(0.5).arcAltitudeAutoScale(0.4);
      setTimeout(() => g.current?.pointOfView({ lat: aLat, lng: aLng, altitude: 1.8 }, 2000), 400);
    },
    reset() {
      active.current = false;
      if (g.current) {
        g.current.htmlElementsData([]).arcsData([]);
        g.current.controls().autoRotate = true;
        el.current.style.cursor = 'grab';
      }
    },
  }));

  return <div ref={el} className="absolute inset-0 z-[1]" />;
});
