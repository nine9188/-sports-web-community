import { siteConfig } from '@/shared/config';

type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

export type JsonLdObject = { [key: string]: JsonLdValue };

export type BreadcrumbJsonLdItem = {
  name?: string | null;
  url?: string | null;
};

export const SITE_ORGANIZATION_ID = `${siteConfig.url}#organization`;
export const SITE_WEBSITE_ID = `${siteConfig.url}#website`;

export function absoluteSiteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return siteConfig.getUrl(pathOrUrl);
}

export function buildJsonLdId(pathOrUrl: string, fragment: string): string {
  return `${absoluteSiteUrl(pathOrUrl)}#${fragment.replace(/^#/, '')}`;
}

export function isUsableJsonLdImage(pathOrUrl?: string | null): pathOrUrl is string {
  if (!pathOrUrl) return false;
  return !/\/images\/placeholder-[^/]+\.svg$/i.test(pathOrUrl);
}

export function buildBreadcrumbJsonLd({
  name = 'Breadcrumb',
  items,
  includeLastItem = true,
}: {
  name?: string;
  items: BreadcrumbJsonLdItem[];
  includeLastItem?: boolean;
}): JsonLdObject {
  const validItems = items
    .map((item) => ({
      name: item.name?.trim(),
      url: item.url?.trim(),
    }))
    .filter((item): item is { name: string; url: string } => Boolean(item.name && item.url));

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    name,
    itemListElement: validItems.map((item, index) => {
      const listItem: JsonLdObject = {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
      };

      if (includeLastItem || index < validItems.length - 1) {
        listItem.item = absoluteSiteUrl(item.url);
      }

      return listItem;
    }),
  };
}

export function jsonLdScriptProps(jsonLd: JsonLdObject) {
  return {
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
    },
  };
}
