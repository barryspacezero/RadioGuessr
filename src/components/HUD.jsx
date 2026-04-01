export default function HUD({ roundNumber }) {
    return (
        <div id="hud">
            <div className="hud-logo">📡 RadioGuessr</div>
            <div id="round-badge">Round {roundNumber}</div>
        </div>
    );
}
