import { useEffect, useRef } from 'react';

const WAVE_BARS = 12;

export default function StationPanel({ visible, timer, timerLabel, isWaveformActive }) {
    const barsRef = useRef([]);
    const animRef = useRef(null);

    useEffect(() => {
        const bars = barsRef.current;
        if (!bars.length) return;

        if (isWaveformActive) {
            bars.forEach(bar => {
                bar.classList.add('playing');
                bar.style.setProperty('--dur', `${0.4 + Math.random() * 0.6}s`);
                bar.style.height = `${10 + Math.random() * 26}px`;
            });

            const animate = () => {
                bars.forEach(bar => {
                    bar.style.height = `${8 + Math.random() * 28}px`;
                });
                animRef.current = setTimeout(animate, 120);
            };
            animRef.current = setTimeout(animate, 120);
        } else {
            if (animRef.current) clearTimeout(animRef.current);
            bars.forEach(bar => {
                bar.classList.remove('playing');
                bar.style.height = '6px';
            });
        }

        return () => {
            if (animRef.current) clearTimeout(animRef.current);
        };
    }, [isWaveformActive]);

    return (
        <div id="station-panel" className={visible ? '' : 'hidden'}>
            <div className="station-hint">📻 &nbsp; Mystery Station Playing…</div>

            <div id="waveform">
                {Array.from({ length: WAVE_BARS }, (_, i) => (
                    <div
                        key={i}
                        className="wave-bar"
                        style={{ height: '8px' }}
                        ref={el => { barsRef.current[i] = el; }}
                    />
                ))}
            </div>

            <div id="timer-container">
                <div id="timer" className={timer <= 5 && timer > 0 ? 'urgent' : ''}>
                    {timer}
                </div>
                <div id="timer-label">{timerLabel}</div>
            </div>
        </div>
    );
}
