import type { PageSeoOverride } from '@/domains/seo/actions/seoSettings';

export interface PredefinedPage {
  path: string;
  name: string;
  defaultTitle: string;
  defaultDescription: string;
}

export interface BoardData {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

export interface GlobalSettingsData {
  site_name: string;
  site_url: string;
  default_title: string;
  default_description: string;
  default_keywords: string[];
  og_image: string;
  twitter_handle: string;
}

export interface EditModalData {
  path: string;
  data: PageSeoOverride;
}

export type { PageSeoOverride };
