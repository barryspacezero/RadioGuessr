import { useEffect, useRef } from 'react';

function animateScore(el, targetScore) {
    const duration = 1800;
    const start = performance.now();

    const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - (1 - progress) ** 3;
        el.textContent = Math.round(eased * targetScore).toLocaleString();
        if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

export default function ResultPanel({ visible, data }) {
    const scoreRef = useRef(null);

    useEffect(() => {
        if (visible && data && scoreRef.current) {
            animateScore(scoreRef.current, data.score);
        }
    }, [visible, data]);

    return (
        <div id="result-panel" className={visible ? 'visible' : ''}>
            <div className="result-station-name">{data?.stationName ?? 'Mystery Station'}</div>
            <div className="result-location">🌍 {data?.location ?? 'Unknown'}</div>
            <div className="result-distance">
                You were{' '}
                <span>
                    {data?.distanceKm != null
                        ? (data.distanceKm < 1 ? 'less than 1 km' : `${data.distanceKm.toLocaleString()} km`)
                        : '0 km'}
                </span>{' '}
                away
            </div>
            <div className="result-divider" />
            <div className="score-display">
                <div className="score-label">Score</div>
                <div className="score-value" ref={scoreRef}>0</div>
                <div className="score-tier">{data?.tier ?? '🎯 Pinpoint!'}</div>
            </div>
        </div>
    );
}
