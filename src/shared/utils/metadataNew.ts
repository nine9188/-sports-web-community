import { Metadata } from 'next';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';

interface DefaultMeta {
  title: string;
  description: string;
}

const defaultSiteName = '4590 Football';
const defaultSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://4590.co.kr';
const defaultOgImage = '/og-image.png';

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');
const buildUrl = (baseUrl: string, path: string) => {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
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
    const siteUrl = seoSettings?.site_url || defaultSiteUrl;
    const siteName = seoSettings?.site_name || defaultSiteName;
    const ogImagePath = seoSettings?.og_image || defaultOgImage;
    const ogImage = buildUrl(siteUrl, ogImagePath);
    const canonicalUrl = buildUrl(siteUrl, pagePath);
    const imageType = ogImagePath.endsWith('.jpg') || ogImagePath.endsWith('.jpeg')
      ? 'image/jpeg'
      : 'image/png';

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
        locale: 'ko_KR',
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
      other: {
        'og:image:secure_url': ogImage,
        'og:image:type': imageType,
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:image:alt': title,
        'twitter:image': ogImage,
        'image': ogImage,
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
    const siteUrl = seoSettings?.site_url || defaultSiteUrl;
    const siteName = seoSettings?.site_name || defaultSiteName;
    const ogImagePath = seoSettings?.og_image || defaultOgImage;
    const ogImage = buildUrl(siteUrl, ogImagePath);
    const canonicalUrl = buildUrl(siteUrl, pagePath);
    const imageType = ogImagePath.endsWith('.jpg') || ogImagePath.endsWith('.jpeg')
      ? 'image/jpeg'
      : 'image/png';

    if (!seoSettings) {
      // DB 조회 실패 시 기본값
      return {
        title: defaultSiteName,
        description: '축구 커뮤니티',
        openGraph: {
          title: defaultSiteName,
          description: '축구 커뮤니티',
          url: canonicalUrl,
          siteName,
          images: [{
            url: ogImage,
            width: 1200,
            height: 630,
            alt: defaultSiteName,
            type: imageType,
          }],
          locale: 'ko_KR',
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: defaultSiteName,
          description: '축구 커뮤니티',
          images: [ogImage],
        },
        alternates: {
          canonical: canonicalUrl,
        },
        other: {
          'og:image:secure_url': ogImage,
          'og:image:type': imageType,
          'og:image:width': '1200',
          'og:image:height': '630',
          'og:image:alt': defaultSiteName,
          'twitter:image': ogImage,
          'image': ogImage,
        },
      };
    }

    // 페이지별 오버라이드 확인
    const pageOverride = seoSettings.page_overrides?.[pagePath];

    // 제목, 설명, 키워드 결정
    const title = pageOverride?.title || seoSettings.default_title;
    const description = pageOverride?.description || seoSettings.default_description;
    const keywords = pageOverride?.keywords || seoSettings.default_keywords;

    // OG 이미지 절대 URL
    
    // 이미지 확장자로 MIME 타입 결정 (Safari는 JPG 선호하지만 PNG도 지원)

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
        locale: 'ko_KR',
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
      // Safari 제안 카드 최적화를 위한 추가 메타태그 (DCInside 방식)
      other: {
        'og:image:secure_url': ogImage,
        'og:image:type': imageType,
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:image:alt': title,
        'twitter:image': ogImage,
        'image': ogImage, // Safari가 우선 인식하는 비공식 태그
      },
    };
  } catch (error) {
    console.error('[generatePageMetadata] 오류:', error);
    return {
      title: '4590 Football',
      description: '축구 커뮤니티',
    };
  }
}
