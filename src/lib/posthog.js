import posthog from 'posthog-js';

const key = import.meta.env.VITE_POSTHOG_KEY;

if (key) {
  posthog.init(key, {
    api_host: 'https://us.i.posthog.com',
    // Disable auto pageview — we fire page_viewed manually on every view change
    // so the SPA's hash-router transitions are captured accurately.
    capture_pageview: false,
    persistence: 'localStorage',
    person_profiles: 'identified_only',
  });
}

export { posthog };

/**
 * track — safe wrapper around posthog.capture.
 * No-ops when VITE_POSTHOG_KEY is not set (local dev without a key).
 */
export function track(event, properties) {
  if (!key) return;
  posthog.capture(event, properties);
}
