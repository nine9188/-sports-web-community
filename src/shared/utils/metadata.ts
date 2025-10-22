import { Metadata } from 'next';
import { PageMetadata } from '@/domains/site-config/types';
import { getPageMetadataByPath, getPublicSiteSettings, getBrandingConfig } from '@/domains/site-config/actions';

/**
 * 특정 페이지의 Next.js Metadata를 생성합니다.
 */
export async function generatePageMetadata(
  pagePath: string,
  fallback?: Partial<Metadata>
): Promise<Metadata> {
  try {
    // 페이지별 메타데이터 가져오기
    const pageMetadata = await getPageMetadataByPath(pagePath);

    // 공개 사이트 설정 및 브랜딩 가져오기
    const [siteSettings, brandingConfig] = await Promise.all([
      getPublicSiteSettings(),
      getBrandingConfig(),
    ]);

    // 기본값 설정
    const siteName = siteSettings.site_name || 'SPORTS 커뮤니티';
    const siteUrl = siteSettings.site_url || process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';
    const defaultOgImagePath = siteSettings.og_default_image || '/og-image.png';
    // OG 이미지는 절대 URL이 필요함
    const defaultOgImage = defaultOgImagePath.startsWith('http')
      ? defaultOgImagePath
      : `${siteUrl}${defaultOgImagePath}`;

    // 파비콘 및 아이콘 설정
    const icons: Metadata['icons'] = {
      icon: brandingConfig.favicon || '/favicon.ico',
      apple: brandingConfig.appleIcon || '/apple-touch-icon.png',
    };

    // 페이지 메타데이터가 있으면 우선 사용
    if (pageMetadata) {
      return {
        ...buildMetadata(pageMetadata, siteName, siteUrl, defaultOgImage),
        icons,
      };
    }

    // 없으면 fallback 사용
    return {
      title: fallback?.title || siteName,
      description: fallback?.description || siteSettings.site_description,
      keywords: fallback?.keywords || siteSettings.site_keywords,
      icons,
      openGraph: {
        title: fallback?.title as string || siteName,
        description: fallback?.description as string || siteSettings.site_description,
        url: `${siteUrl}${pagePath}`,
        siteName,
        images: [
          {
            url: defaultOgImage,
            width: 1200,
            height: 630,
          },
        ],
        locale: 'ko_KR',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: fallback?.title as string || siteName,
        description: fallback?.description as string || siteSettings.site_description,
        images: [defaultOgImage],
        creator: siteSettings.twitter_handle,
      },
    };
  } catch (error) {
    console.error('메타데이터 생성 오류:', error);
    // 오류 시 최소한의 메타데이터 반환
    return {
      title: fallback?.title || 'SPORTS 커뮤니티',
      description: fallback?.description || '스포츠 팬들을 위한 커뮤니티',
    };
  }
}

/**
 * PageMetadata 객체로부터 Next.js Metadata를 빌드합니다.
 */
function buildMetadata(
  pageMetadata: PageMetadata,
  siteName: string,
  siteUrl: string,
  defaultOgImage: string
): Metadata {
  // OG 이미지를 절대 URL로 변환
  const ogImagePath = pageMetadata.og_image || defaultOgImage;
  const ogImage = ogImagePath.startsWith('http')
    ? ogImagePath
    : `${siteUrl}${ogImagePath}`;

  const twitterImagePath = pageMetadata.twitter_image || ogImagePath;
  const twitterImage = twitterImagePath.startsWith('http')
    ? twitterImagePath
    : `${siteUrl}${twitterImagePath}`;

  return {
    title: pageMetadata.title || siteName,
    description: pageMetadata.description,
    keywords: pageMetadata.keywords,
    robots: pageMetadata.robots || 'index,follow',
    openGraph: {
      title: pageMetadata.og_title || pageMetadata.title || siteName,
      description: pageMetadata.og_description || pageMetadata.description,
      url: pageMetadata.canonical_url || `${siteUrl}${pageMetadata.page_path}`,
      siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
        },
      ],
      locale: 'ko_KR',
      type: (pageMetadata.og_type as any) || 'website',
    },
    twitter: {
      card: (pageMetadata.twitter_card as any) || 'summary_large_image',
      title: pageMetadata.twitter_title || pageMetadata.title || siteName,
      description: pageMetadata.twitter_description || pageMetadata.description,
      images: [twitterImage],
    },
    alternates: pageMetadata.canonical_url
      ? {
          canonical: pageMetadata.canonical_url,
        }
      : undefined,
  };
}

/**
 * 게시글과 같은 동적 콘텐츠의 메타데이터를 생성합니다.
 */
export function generateDynamicMetadata(options: {
  title: string;
  description?: string;
  image?: string;
  path: string;
  type?: 'article' | 'website';
  publishedTime?: string;
  author?: string;
}): Metadata {
  const { title, description, image, path, type = 'article', publishedTime, author } = options;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: path,
      type,
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
            },
          ]
        : undefined,
      ...(type === 'article' && publishedTime
        ? {
            publishedTime,
            authors: author ? [author] : undefined,
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
