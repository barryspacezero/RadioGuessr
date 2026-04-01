export default function Toast({ message, visible }) {
    return (
        <div id="toast" className={visible ? 'show' : ''}>
            {message}
        </div>
    );
}
