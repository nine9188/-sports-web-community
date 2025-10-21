// 사이트 설정 타입
export interface SiteSetting {
  key: string;
  value: any;
  category: 'seo' | 'branding' | 'analytics' | 'general';
  label: string;
  description?: string;
  data_type: 'text' | 'number' | 'boolean' | 'json' | 'image';
  is_public: boolean;
  updated_at: string;
  updated_by?: string;
}

// 페이지 메타데이터 타입
export interface PageMetadata {
  id: string;
  page_path: string;
  page_type: 'default' | 'boards' | 'livescore' | 'shop' | 'post' | 'custom';
  title?: string;
  description?: string;
  keywords?: string[];
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_type?: string;
  twitter_card?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  canonical_url?: string;
  robots?: string;
  structured_data?: Record<string, any>;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

// 브랜딩 자산 타입
export interface BrandingAsset {
  id: string;
  asset_type: 'logo' | 'favicon' | 'og_image' | 'apple_icon';
  variant?: string;
  size?: string;
  file_name: string;
  file_url: string;
  storage_path?: string;
  file_size?: number;
  content_type: string;
  is_active: boolean;
  display_order: number;
  metadata?: Record<string, any>;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

// 폼 데이터 타입
export interface SiteSettingFormData {
  key: string;
  value: any;
  category: SiteSetting['category'];
  label: string;
  description?: string;
  data_type: SiteSetting['data_type'];
  is_public: boolean;
}

export interface PageMetadataFormData {
  page_path: string;
  page_type: PageMetadata['page_type'];
  title?: string;
  description?: string;
  keywords?: string[];
  og_title?: string;
  og_description?: string;
  og_image?: string;
  canonical_url?: string;
  robots?: string;
}

// 설정 카테고리별 그룹
export interface SiteSettingsByCategory {
  seo: SiteSetting[];
  branding: SiteSetting[];
  analytics: SiteSetting[];
  general: SiteSetting[];
}
