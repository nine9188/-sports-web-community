import { Metadata } from 'next';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';

/**
 * 페이지의 메타데이터를 생성합니다 (초간단 버전!)
 */
export async function generatePageMetadata(pagePath: string): Promise<Metadata> {
  try {
    const seoSettings = await getSeoSettings();

    if (!seoSettings) {
      // DB 조회 실패 시 기본값
      return {
        title: '4590 Football',
        description: '축구 커뮤니티',
      };
    }

    // 페이지별 오버라이드 확인
    const pageOverride = seoSettings.page_overrides?.[pagePath];

    // 제목, 설명, 키워드 결정
    const title = pageOverride?.title || seoSettings.default_title;
    const description = pageOverride?.description || seoSettings.default_description;
    const keywords = pageOverride?.keywords || seoSettings.default_keywords;

    // OG 이미지 절대 URL
    const ogImage = `${seoSettings.site_url}${seoSettings.og_image}`;
    
    // 이미지 확장자로 MIME 타입 결정 (Safari는 JPG 선호하지만 PNG도 지원)
    const imageType = seoSettings.og_image.endsWith('.jpg') || seoSettings.og_image.endsWith('.jpeg')
      ? 'image/jpeg'
      : 'image/png';

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        url: `${seoSettings.site_url}${pagePath}`,
        siteName: seoSettings.site_name,
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
