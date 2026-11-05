import productRegistry from './productRegistry.json';
import type { SubproductManifest } from './types';

export const CANONICAL_PRODUCTS = productRegistry as SubproductManifest[];

export function resolveProductUrl(manifest: SubproductManifest): string {
  if (typeof window !== 'undefined') {
    const isCloud = window.location.hostname.includes('pages.dev') || window.location.hostname.includes('trucking.io');
    if (isCloud) {
      return manifest.routes.cloud;
    }
  }
  return manifest.routes.dev;
}
