/**
 * Globe component — a thin wrapper that attaches the useGlobe containerRef
 * to a full-screen div. The globe.gl instance mounts itself into this div
 * via the useGlobe hook (initialised in useGame).
 */
export default function Globe({ containerRef }) {
    return <div id="globe-container" ref={containerRef} />;
}
