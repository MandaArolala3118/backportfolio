// services/analytics.js
const { track } = require('@vercel/analytics/server');

/**
 * Track API events using Vercel Analytics
 * @param {string} eventName - Name of the event to track
 * @param {object} properties - Optional properties to include with the event
 */
async function trackEvent(eventName, properties = {}) {
  try {
    // Only track events in production to avoid polluting analytics data
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
      await track(eventName, properties);
    }
  } catch (err) {
    // Log errors but don't fail the request
    console.error('[Analytics Error]', err.message);
  }
}

module.exports = { trackEvent };
