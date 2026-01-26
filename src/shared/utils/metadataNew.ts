import { Metadata } from 'next';
import { cache } from 'react';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';
import { siteConfig } from '@/shared/config';

// ============================================================
// 새로운 통합 SEO API (2026-01-26)
// ============================================================

/**
 * 전역 SEO 설정 타입
 */
export interface SeoConfig {
  siteName: string;
  siteDescription: string;
  siteKeywords: string[];
  twitterHandle: string;
  defaultOgImage: string;
  siteUrl: string;
}

/**
 * buildMetadata 입력 파라미터
 */
export interface BuildMetadataParams {
  /** 페이지 제목 (필수) */
  title: string;
  /** URL 경로 (필수) - 예: '/boards/free' */
  path: string;
  /** 페이지 설명 (선택) - 없으면 전역 설명 사용 */
  description?: string;
  /** OG 이미지 URL (선택) - 없으면 전역 이미지 사용 */
  image?: string;
  /** 검색 제외 여부 (선택) */
  noindex?: boolean;
  /** 페이지 타입 (선택) */
  type?: 'website' | 'article';
  /** 게시 시간 - article 타입용 (선택) */
  publishedTime?: string;
  /** 수정 시간 - article 타입용 (선택) */
  modifiedTime?: string;
  /** 페이지별 키워드 (선택) */
  keywords?: string[];
  /** 제목에 사이트 이름 붙이지 않기 (선택) */
  titleOnly?: boolean;
}

/**
 * 전역 SEO 설정 조회 (DB 우선, site.ts 폴백)
 *
 * React cache()로 요청당 1회만 조회
 */
export const getSeoConfig = cache(async (): Promise<SeoConfig> => {
  try {
    const dbSettings = await getSeoSettings();

    return {
      siteName: dbSettings?.site_name || siteConfig.name,
      siteDescription: dbSettings?.default_description || siteConfig.description,
      siteKeywords: dbSettings?.default_keywords || siteConfig.keywords,
      twitterHandle: dbSettings?.twitter_handle || siteConfig.twitterHandle,
      defaultOgImage: siteConfig.getOgImage(dbSettings?.og_image),
      siteUrl: dbSettings?.site_url || siteConfig.url,
    };
  } catch (error) {
    console.error('[getSeoConfig] DB 조회 실패, site.ts 폴백 사용:', error);
    return {
      siteName: siteConfig.name,
      siteDescription: siteConfig.description,
      siteKeywords: siteConfig.keywords,
      twitterHandle: siteConfig.twitterHandle,
      defaultOgImage: siteConfig.defaultOgImage,
      siteUrl: siteConfig.url,
    };
  }
});

/**
 * 메타데이터 생성 (단일 진입점)
 *
 * 모든 페이지에서 이 함수만 호출하면 됨
 *
 * @example
 * // 기본 사용
 * return buildMetadata({
 *   title: '자유게시판',
 *   path: '/boards/free',
 * });
 *
 * @example
 * // 상세 페이지
 * return buildMetadata({
 *   title: post.title,
 *   description: extractDescription(post.content),
 *   path: `/boards/${slug}/${postNumber}`,
 *   type: 'article',
 *   publishedTime: post.created_at,
 * });
 *
 * @example
 * // 검색 제외 페이지
 * return buildMetadata({
 *   title: '로그인',
 *   path: '/auth/login',
 *   noindex: true,
 * });
 */
export async function buildMetadata(params: BuildMetadataParams): Promise<Metadata> {
  const config = await getSeoConfig();

  // 제목 조합
  const fullTitle = params.titleOnly
    ? params.title
    : `${params.title} - ${config.siteName}`;

  // 설명 (페이지 고유값 > 전역값)
  const description = params.description || config.siteDescription;

  // URL
  const canonicalUrl = `${config.siteUrl}${params.path}`;

  // 이미지
  const ogImage = params.image
    ? (params.image.startsWith('http') ? params.image : `${config.siteUrl}${params.image}`)
    : config.defaultOgImage;

  // 키워드
  const keywords = params.keywords || config.siteKeywords;

  // 이미지 타입
  const imageType = ogImage.endsWith('.jpg') || ogImage.endsWith('.jpeg')
    ? 'image/jpeg'
    : 'image/png';

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords,
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: config.siteName,
      locale: siteConfig.locale,
      type: params.type || 'website',
      images: [{
        url: ogImage,
        width: 1200,
        height: 630,
        alt: params.title,
        type: imageType,
      }],
      ...(params.publishedTime && { publishedTime: params.publishedTime }),
      ...(params.modifiedTime && { modifiedTime: params.modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
      creator: config.twitterHandle,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };

  // noindex 처리
  if (params.noindex) {
    metadata.robots = { index: false, follow: false };
  }

  return metadata;
}

// ============================================================
// 기존 API (하위 호환성 - 점진적으로 제거 예정)
// ============================================================

interface DefaultMeta {
  title: string;
  description: string;
}

/**
 * 이미지 경로로부터 MIME 타입을 결정합니다.
 */
const getImageType = (path: string): string => {
  return path.endsWith('.jpg') || path.endsWith('.jpeg')
    ? 'image/jpeg'
    : 'image/png';
};

/**
 * 페이지의 메타데이터를 생성합니다.
 * DB에 page_overrides가 있으면 우선 사용, 없으면 제공된 기본값 사용
 */
export async function generatePageMetadataWithDefaults(
  pagePath: string,
  defaults: DefaultMeta
): Promise<Metadata> {
  try {
    const seoSettings = await getSeoSettings();

    // siteConfig 기반, seoSettings 우선
    const siteName = seoSettings?.site_name || siteConfig.name;

    // OG 이미지: siteConfig.getOgImage()로 절대 URL 처리 (http:// 체크 포함)
    const ogImage = siteConfig.getOgImage(seoSettings?.og_image);
    const canonicalUrl = siteConfig.getCanonical(pagePath);
    const imageType = getImageType(ogImage);

    // 페이지별 오버라이드 확인
    const pageOverride = seoSettings?.page_overrides?.[pagePath];

    // DB 설정 우선, 없으면 기본값
    const title = pageOverride?.title || defaults.title;
    const description = pageOverride?.description || defaults.description;
    const keywords = pageOverride?.keywords || seoSettings?.default_keywords;

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName,
        images: [{
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
          type: imageType,
        }],
        locale: siteConfig.locale,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
        creator: seoSettings?.twitter_handle,
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch (error) {
    console.error('[generatePageMetadataWithDefaults] 오류:', error);
    return {
      title: defaults.title,
      description: defaults.description,
    };
  }
}

/**
 * 페이지의 메타데이터를 생성합니다 (초간단 버전!)
 */
export async function generatePageMetadata(pagePath: string): Promise<Metadata> {
  try {
    const seoSettings = await getSeoSettings();

    // siteConfig 기반, seoSettings 우선
    const siteName = seoSettings?.site_name || siteConfig.name;

    // OG 이미지: siteConfig.getOgImage()로 절대 URL 처리 (http:// 체크 포함)
    const ogImage = siteConfig.getOgImage(seoSettings?.og_image);
    const canonicalUrl = siteConfig.getCanonical(pagePath);
    const imageType = getImageType(ogImage);

    if (!seoSettings) {
      // DB 조회 실패 시 기본값
      return {
        title: siteConfig.name,
        description: '축구 커뮤니티',
        openGraph: {
          title: siteConfig.name,
          description: '축구 커뮤니티',
          url: canonicalUrl,
          siteName,
          images: [{
            url: ogImage,
            width: 1200,
            height: 630,
            alt: siteConfig.name,
            type: imageType,
          }],
          locale: siteConfig.locale,
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: siteConfig.name,
          description: '축구 커뮤니티',
          images: [ogImage],
        },
        alternates: {
          canonical: canonicalUrl,
        },
      };
    }

    // 페이지별 오버라이드 확인
    const pageOverride = seoSettings.page_overrides?.[pagePath];

    // 제목, 설명, 키워드 결정
    const title = pageOverride?.title || seoSettings.default_title;
    const description = pageOverride?.description || seoSettings.default_description;
    const keywords = pageOverride?.keywords || seoSettings.default_keywords;

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName,
        images: [{
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
          type: imageType,
        }],
        locale: siteConfig.locale,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
        creator: seoSettings.twitter_handle,
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch (error) {
    console.error('[generatePageMetadata] 오류:', error);
    return {
      title: siteConfig.name,
      description: '축구 커뮤니티',
    };
  }
}
