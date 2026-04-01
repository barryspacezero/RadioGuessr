export default function LoadingOverlay({ visible }) {
    return (
        <div id="loading-overlay" className={visible ? 'visible' : ''}>
            <div className="spinner" />
            <div className="loading-text">Finding a radio station…</div>
        </div>
    );
}
