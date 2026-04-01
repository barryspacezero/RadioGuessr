export default function StartScreen({ visible, onStart }) {
    return (
        <div id="start-screen" className={visible ? '' : 'hidden'}>
            <div className="start-logo">📡 RadioGuessr</div>
            <p className="start-subtitle">
                Listen to a live radio stream from somewhere on Earth.<br />
                Drop a pin. Score points. Repeat.
            </p>
            <div className="start-features">
                <div className="feature-chip">🎵 <span>Live Streams</span></div>
                <div className="feature-chip">🌍 <span>3D Globe</span></div>
                <div className="feature-chip">🏆 <span>5000 pts max</span></div>
            </div>
            <button className="btn btn-primary" id="btn-play-start" onClick={onStart}>
                🎯 &nbsp; Start Game
            </button>
        </div>
    );
}
