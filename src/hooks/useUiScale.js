import { useState, useEffect } from 'react';

export function useUiScale() {
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateScale = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      let newScale = 1;

      if (w === 0 || h === 0) {
        newScale = 1;
        setIsMobile(false);
      } else if (w < 600) {
        setIsMobile(true);
        // Mobile layout
        // Base logical size: 390x750
        const widthScale = w / 390;
        const heightScale = h / 750;
        newScale = Math.max(0.1, Math.min(1, widthScale, heightScale));
      } else {
        setIsMobile(false);
        // Desktop layout
        // Base logical size: 1000x750 (gives enough horizontal breathing room)
        const widthScale = w / 1000;
        const heightScale = h / 750;
        newScale = Math.max(0.1, Math.min(1, widthScale, heightScale));
      }
      
      setScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return { scale, isMobile };
}
