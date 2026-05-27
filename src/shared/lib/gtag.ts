export const GA_MEASUREMENT_ID = 'G-MESEGFZZPF';

type GtagParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params?: GtagParams) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtagFallback(...args: unknown[]) {
    window.dataLayer?.push(args);
  };

  window.gtag('event', eventName, {
    ...params,
    event_category: params?.event_category || 'engagement',
  });

  if (process.env.NODE_ENV === 'development') {
    console.info('[GA4 event]', eventName, params);
  }
}
