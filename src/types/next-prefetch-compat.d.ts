import type { InstantConfigForTypeCheckInternal } from 'next/dist/build/segment-config/app/app-segment-config';

declare module 'next/dist/build/segment-config/app/app-segment-config' {
  export type PrefetchForTypeCheckInternal = InstantConfigForTypeCheckInternal;
}
