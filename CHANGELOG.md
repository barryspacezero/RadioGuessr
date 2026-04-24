# Changelog

All notable changes to the **RadioGuessr** project will be documented in this file.

## [1.4.0] - 2026-04-24
### Added
- **Curated Genres**: Smart Radio API filtering to query highly-voted music and talk stations instead of random ambient noise.
- **Interactive TopoJSON Overlays**: Users can now optionally toggle detailed country borders and hover labels built directly into the 3D globe.
- **Capital City Fallback Strategy**: Added a static dictionary to intelligently substitute missing regional API clues with capital cities.
- **Persistent Mobile Actions**: "Submit Guess" buttons and core branding will now permanently float within natural reach regardless of the active hint panel dimensions.
- **Robust SEO Implementation**: Upgraded `index.html` with full primary metadata, Open Graph labels, and Twitter Cards to securely index social links.

### Changed
- **Anti-Spoiler UI**: Omitted the display of radio station titles from the active "Playing" phase to enforce pure guessing integrity. Station titles are now beautifully revealed only after placing a guess.
- **Globe Clicking Event Map**: Repurposed pointer-events directly onto `globe.gl` polygons, allowing clicks through border features to appropriately stick down guess pins.
- **Tooltip Theming**: Restyled native globe labels with heavy neo-brutalism aesthetics to flawlessly overlap `.float-tooltip` component layers with the core React UI.

## [1.3.0] - 2026-04-19
### Added
- Launch of stable GeoGuessr-style core gameplay mechanics using live streams.
- Integrated `globe.gl` library with multiple map textures (Blue Marble, Night, Water, Day).
- Collapsible responsive bottom-tray for displaying game flow and logic cleanly across desktop and mobile.
- Session summary logic routing directly to FlagCDN for vector generation tracking history.
- Click-to-pay penalty rules deducting hint credits for exposing API broadcasting Language, City, or Regional strings.

## [1.2.0] - 2026-04-16
### Added
- Implemented robust HLS (.m3u8) audio stream support for superior live-broadcast compatibility.
- Implemented silent stream rerouting to automatically skip dead or broken audio links seamlessly.

### Changed
- Improved the active Mobile UI presentation.
- Made the Desktop UI more gripping natively by integrating heavy backdrop blurs on hovering UI cards.

## [1.1.0] - 2026-04-12
### Added
- Implemented basic RadioGuessr game loop mechanics including polling random internet stations and placing global coordinates on a map.
