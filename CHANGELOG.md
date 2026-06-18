# Changelog

All notable changes to the **RadioGuessr** project will be documented in this file.

## [2.1.0] - 2026-06-18
### Added
- **Lifetime Passport Stamps**: Upgraded the session history into a persistent, global "Passport" using `localStorage`. Every country you ever discover is now permanently stamped into your profile.
- **Embedded Leaderboard UX**: The global leaderboard is now beautifully embedded directly into the final screen without modals. It features smart auto-scrolling that instantly drops you to your exact projected rank position so you can type your name seamlessly.
- **API Load Balancer & Auto-Failover**: Replaced the hardcoded Radio Browser API node with a dynamic array of official global servers (`de1`, `at1`, `nl1`). The engine acts as its own load-balancer, randomly picking nodes to completely eliminate game crashes caused by 503 Service Unavailable errors or CORS blocks on overloaded nodes.
### Changed
- **Mobile UI Polish**: Increased bottom margins for floating action buttons on mobile devices to prevent them from colliding with browser toolbars or phone screen curves.
- **Aesthetic Refinements**: Re-aligned the final screen action buttons (Passport, Play Again, GitHub) into a sleek, centralized row and gracefully scaled down massive text headers for a more premium, less clunky layout.

## [2.0.0] - 2026-06-18
### Added
- **Global Leaderboard**: Integrated Supabase to power a real-time, global leaderboard. Players can submit their arcade-style names after playing and filter top scores globally based on their chosen round length.
- **Talk Mode**: Added a new toggle that automatically filters out music stations in favor of news, talk, and public radio to make language guessing easier.
- **Customizable Rounds**: Players can now select between 3, 5, 10, or 20 rounds per session, with hint credits scaling appropriately.
- **Stream Pooling & Silent Fallbacks**: The engine now intelligently fetches pools of up to 100 stations at once. If a stream is broken or blocked by CORS, it silently skips to the next working station in the pool without interrupting the player's game or depleting retries.
### Changed
- **Start Screen UI**: Refactored the settings layout to use a much cleaner horizontal grid, making the screen less vertically cluttered.
- **Retro Aesthetic**: Added a bouncing, pulsing "2.0!" tag to the main logo using the 'Press Start 2P' 8-bit font, heavily inspired by the classic Minecraft splash text.

## [1.5.0] - 2026-05-17
### Added
- **Intelligent Same-Country Rerolls**: Designed and built the "Reroll (Same Country)" gameplay escape hatch inside loading placeholders and active playing panels to cleanly fetch alternative stations from the same country when encountering broken, silent, or slow streams. Includes in-memory seen station tracking to guarantee a fresh station.
- **Conscious Playback Control**: Integrated automated stream pausing upon guess submission, prompting users with a clear "Keep Listening" resume action on the result card for improved audio choice and UX.
- **Integrated GA4 Analytics Reporting**: Created a crash-safe analytics utility (`analytics.js`) communicating directly with GA4 (`G-J2MP9VVJHJ`) to record key player engagements (game started, round starts, stream load successes/fails, hints clicked, rerolls requested, guesses submitted, keep listening clicks, and game completions). Prints logs in the developer console during local dev.
### Changed
- **Hint Penalty Balance**: Adjusted playability configurations so active stream rerolls don't affect standard guessing parameters while preserving session continuity.

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
