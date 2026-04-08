import { SEO_LOCATIONS } from './seoLocations';

export type PrerenderRouteGroup =
  | 'core-static'
  | 'storage-lander'
  | 'delivery-lander'
  | 'spa-only';

export interface PrerenderRouteDefinition {
  path: string;
  group: PrerenderRouteGroup;
  source: 'static' | 'seoLocations';
}

export const CORE_PRERENDER_ROUTES: PrerenderRouteDefinition[] = [
  { path: '/', group: 'core-static', source: 'static' },
  { path: '/locations', group: 'core-static', source: 'static' },
  { path: '/services', group: 'core-static', source: 'static' },
  { path: '/qna', group: 'core-static', source: 'static' },
  { path: '/tracking', group: 'core-static', source: 'static' },
  { path: '/partnership', group: 'core-static', source: 'static' },
  { path: '/vision', group: 'core-static', source: 'static' },
  { path: '/terms', group: 'core-static', source: 'static' },
  { path: '/privacy', group: 'core-static', source: 'static' },
];

export const STORAGE_LANDER_PRERENDER_ROUTES: PrerenderRouteDefinition[] =
  SEO_LOCATIONS.map((location) => ({
    path: `/storage/${location.slug}`,
    group: 'storage-lander',
    source: 'seoLocations',
  }));

export const DELIVERY_LANDER_PRERENDER_ROUTES: PrerenderRouteDefinition[] =
  SEO_LOCATIONS.map((location) => ({
    path: `/delivery/${location.slug}`,
    group: 'delivery-lander',
    source: 'seoLocations',
  }));

export const SPA_ONLY_ROUTES: PrerenderRouteDefinition[] = [
  { path: '/booking', group: 'spa-only', source: 'static' },
  { path: '/booking-success', group: 'spa-only', source: 'static' },
  { path: '/payments/toss/success', group: 'spa-only', source: 'static' },
  { path: '/payments/toss/fail', group: 'spa-only', source: 'static' },
  { path: '/admin', group: 'spa-only', source: 'static' },
  { path: '/admin/dashboard', group: 'spa-only', source: 'static' },
  { path: '/staff/scan', group: 'spa-only', source: 'static' },
  { path: '/mypage', group: 'spa-only', source: 'static' },
];

export const ALL_PRERENDER_ROUTES: PrerenderRouteDefinition[] = [
  ...CORE_PRERENDER_ROUTES,
  ...STORAGE_LANDER_PRERENDER_ROUTES,
  ...DELIVERY_LANDER_PRERENDER_ROUTES,
];
