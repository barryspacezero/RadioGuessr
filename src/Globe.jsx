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

    globe.onGlobeClick(({ lat, lng }) => {
      if (!active.current) return;
      globe.pointsData([{ lat, lng }])
        .pointColor(() => '#ff5252').pointRadius(() => 0.4).pointAltitude(() => 0.01)
        .pointLabel(() => 'Your Guess');
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
        .pointsData([
          { lat: gLat, lng: gLng, c: '#ff5252', l: '📍 Your Guess' },
          { lat: aLat, lng: aLng, c: '#69f0ae', l: '📡 Station' },
        ])
        .pointColor(d => d.c)
        .pointRadius(d => d.l.includes('Station') ? 0.8 : 0.5)
        .pointAltitude(d => d.l.includes('Station') ? 0.015 : 0.01)
        .pointLabel(d => d.l);
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
        g.current.pointsData([]).arcsData([]);
        g.current.controls().autoRotate = true;
        el.current.style.cursor = 'grab';
      }
    },
  }));

  return <div ref={el} className="absolute inset-0 z-[1]" />;
});
