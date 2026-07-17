/**
 * Privacy-first, opt-in analytics. Off unless `VITE_ANALYTICS_DOMAIN` is set at
 * build time, and never runs when the visitor has Do Not Track enabled. Uses a
 * Plausible-style cookieless script (no PII, no cross-site tracking, no consent
 * banner needed); SPA pageviews are auto-tracked via the History API.
 */
const DOMAIN = import.meta.env.VITE_ANALYTICS_DOMAIN as string | undefined;
const SRC =
  (import.meta.env.VITE_ANALYTICS_SRC as string | undefined) ?? 'https://plausible.io/js/script.js';

function doNotTrack(): boolean {
  const nav = navigator as Navigator & { msDoNotTrack?: string };
  const dnt = nav.doNotTrack ?? nav.msDoNotTrack;
  return dnt === '1' || dnt === 'yes';
}

let loaded = false;

export function initAnalytics(): void {
  if (loaded || !DOMAIN || typeof document === 'undefined') return;
  if (doNotTrack()) return; // honor the visitor's choice — load nothing
  loaded = true;

  const script = document.createElement('script');
  script.defer = true;
  script.src = SRC;
  script.setAttribute('data-domain', DOMAIN);
  document.head.appendChild(script);
}
