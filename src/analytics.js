/**
 * Safely reports custom events to Google Analytics 4 (GA4).
 * Prevents errors if gtag is blocked by ad-blockers or not loaded yet.
 * 
 * @param {string} eventName - The name of the custom event.
 * @param {Object} [params] - Optional parameters to send with the event.
 */
export function logEvent(eventName, params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  } else {
    // Fail silently in production, log to console in development
    if (import.meta.env.DEV) {
      console.log(`[Analytics Dev Log] Event: "${eventName}"`, params);
    }
  }
}
