import { Metadata } from 'next';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';
import { siteConfig } from '@/shared/config';

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
