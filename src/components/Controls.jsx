export default function Controls({ activeButton, hint, submitEnabled, onPlay, onSubmit, onNext }) {
    return (
        <div id="controls">
            {activeButton === 'btn-play' && (
                <button className="btn btn-primary" id="btn-play" onClick={onPlay}>
                    ▶ &nbsp; Play Radio
                </button>
            )}

            {activeButton === 'btn-submit' && (
                <button
                    className="btn btn-submit"
                    id="btn-submit"
                    disabled={!submitEnabled}
                    onClick={onSubmit}
                >
                    ✔ &nbsp; Submit Guess
                </button>
            )}

            {activeButton === 'btn-next' && (
                <button className="btn btn-primary" id="btn-next" onClick={onNext}>
                    ▶ &nbsp; Next Round
                </button>
            )}

            {hint && <div id="hint-text">{hint}</div>}
        </div>
    );
}
