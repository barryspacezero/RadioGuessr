import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import Globe from 'globe.gl';

const EARTH = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
const BUMP = 'https://unpkg.com/three-globe/example/img/earth-topology.png';
const SKY = 'https://unpkg.com/three-globe/example/img/night-sky.png';

export default forwardRef(function GlobeView({ onGuess }, ref) {
  const el = useRef(null);
  const g = useRef(null);
  const active = useRef(false);

  useEffect(() => {
    const globe = Globe()
      .globeImageUrl(EARTH).bumpImageUrl(BUMP).backgroundImageUrl(SKY)
      .showAtmosphere(true).atmosphereColor('#4fc3f7').atmosphereAltitude(0.18)
      .width(window.innerWidth).height(window.innerHeight)(el.current);

    globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
    Object.assign(globe.controls(), {
      autoRotate: true, autoRotateSpeed: 0.4,
      enableDamping: true, dampingFactor: 0.08,
      minDistance: 140, maxDistance: 600,
    });

    const createMarker = (color, label) => {
      // globe.gl anchors the TOP-LEFT of this returned element to the lat/lng coordinate.
      // We therefore build the root element directly and apply translate(-50%, -50%) to IT,
      // so the visual center of the dot sits exactly on the coordinate (and on the arc endpoints).
      const root = document.createElement('div');
      Object.assign(root.style, {
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      });
      root.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; pointer-events: auto;">
          <!-- ping ring -->
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: ${color}; opacity: 0.5; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite; pointer-events: none;"></div>
          <!-- solid dot -->
          <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${color}; border: 2px solid #000; box-shadow: 2px 2px 0px rgba(0,0,0,1); position: relative; z-index: 1;"></div>
          <!-- label -->
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
