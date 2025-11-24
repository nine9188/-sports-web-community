# 🍎 Safari 제안 카드 OG 이미지 최적화 가이드

## 📌 문제 상황

Safari는 기본적으로 **화면 스냅샷**을 제안 카드(Siri 제안, 공유 시트)에 사용합니다.  
이로 인해 OG 이미지가 설정되어 있어도 카카오톡과 달리 Safari에서는 회색 박스나 파비콘만 표시될 수 있습니다.

## 🎯 해결 방법

DCInside 같은 사이트는 **확장 OG 메타태그**를 추가하여 Safari가 스냅샷 대신 OG 이미지를 우선 사용하도록 합니다.

### ✅ 적용된 최적화

이 프로젝트에는 다음과 같은 Safari 최적화가 적용되어 있습니다:

#### 1. 확장 OG 메타태그 자동 추가

`src/shared/utils/metadataNew.ts`에서 다음 메타태그를 자동 생성합니다:

```typescript
other: {
  'og:image:secure_url': ogImage,      // Safari 우선 인식
  'og:image:type': imageType,          // MIME 타입 명시
  'og:image:width': '1200',            // 크기 명시
  'og:image:height': '630',
  'og:image:alt': title,               // 접근성
  'twitter:image': ogImage,            // Twitter/Safari 호환
  'image': ogImage,                    // Safari 비공식 태그 (최우선)
}
```

#### 2. 이미지 형식 자동 감지

```typescript
// JPG/JPEG → image/jpeg
// PNG → image/png
const imageType = seoSettings.og_image.endsWith('.jpg') || 
                  seoSettings.og_image.endsWith('.jpeg')
  ? 'image/jpeg'
  : 'image/png';
```

## 🖼️ 권장 이미지 사양

### Safari 최적화를 위한 권장 사항

| 항목 | 권장값 | 이유 |
|-----|-------|------|
| **형식** | JPG | Safari가 JPG를 우선 인식 (PNG도 가능) |
| **크기** | 1200x630px | OG 표준 크기 |
| **용량** | 8MB 이하 | 대부분의 플랫폼 제한 |
| **경로** | 절대 URL | `https://yourdomain.com/og-image.jpg` |
| **프로토콜** | HTTPS | 필수 |

## 🔧 설정 방법

### 1. DB에서 OG 이미지 설정

```sql
UPDATE seo_settings
SET og_image = '/og-image.jpg'  -- JPG 권장
WHERE id = '00000000-0000-0000-0000-000000000001';
```

### 2. 이미지 파일 배치

`public/og-image.jpg` 또는 `public/og-image.png` 파일을 배치합니다.

### 3. 자동 적용

메타데이터 생성 함수가 자동으로 Safari 최적화 태그를 추가합니다.

## 🧪 테스트 방법

### 1. 메타태그 확인

배포 후 페이지 소스에서 다음 태그들이 있는지 확인:

```html
<meta property="og:image" content="https://yourdomain.com/og-image.jpg">
<meta property="og:image:secure_url" content="https://yourdomain.com/og-image.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:image" content="https://yourdomain.com/og-image.jpg">
<meta name="image" content="https://yourdomain.com/og-image.jpg">
```

### 2. Safari 제안 카드 테스트

1. Safari에서 URL 복사
2. 메시지 앱에서 붙여넣기
3. 제안 카드에 OG 이미지가 표시되는지 확인

### 3. 온라인 도구 활용

- [OpenGraph.xyz](https://www.opengraph.xyz/) - OG 이미지 미리보기
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Facebook Debugger](https://developers.facebook.com/tools/debug/)

## ⚠️ 주의사항

### Safari 캐시 문제

Safari는 제안 카드를 **매우 강하게 캐싱**합니다.

- 이미지 변경 후 즉시 반영되지 않을 수 있음
- 캐시 클리어: Safari 설정 → 방문 기록 지우기
- 시간이 지나면 자동으로 갱신됨

### DCInside와의 차이점

| 항목 | DCInside | 이 프로젝트 |
|-----|----------|------------|
| 기본 동작 | 확장 OG 태그로 이미지 표시 | 동일하게 적용됨 ✅ |
| 이미지 형식 | JPG | JPG/PNG 모두 지원 |
| 메타태그 | 수동 추가 | 자동 생성 ✅ |

## 📊 플랫폼별 동작 차이

| 플랫폼 | OG 이미지 인식 | 비고 |
|-------|--------------|------|
| 카카오톡 | ✅ 항상 표시 | 표준 og:image만으로 충분 |
| Facebook | ✅ 항상 표시 | 캐시 관리 필요 |
| Twitter | ✅ 항상 표시 | twitter:image 우선 |
| Safari | ⚠️ 조건부 | 확장 태그 필요 (현재 적용됨) |
| LinkedIn | ✅ 항상 표시 | 표준 OG 태그 사용 |

## 🚀 추가 최적화 (선택사항)

### JPG로 변환하기

PNG를 JPG로 변환하면 Safari 인식률이 더 높아집니다:

```bash
# ImageMagick 사용
convert public/og-image.png -quality 90 public/og-image.jpg

# 또는 온라인 도구 사용
# https://www.iloveimg.com/convert-to-jpg
```

변환 후 DB 업데이트:

```sql
UPDATE seo_settings
SET og_image = '/og-image.jpg'
WHERE id = '00000000-0000-0000-0000-000000000001';
```

## 📚 참고 자료

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Safari Web Content Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/Introduction/Introduction.html)

## 💡 결론

이 프로젝트는 **DCInside와 동일한 방식**으로 Safari 제안 카드 최적화가 적용되어 있습니다.

- ✅ 확장 OG 메타태그 자동 추가
- ✅ JPG/PNG 모두 지원
- ✅ Safari 우선 인식 태그 포함
- ✅ 관리자 페이지에서 가이드 제공

배포 후 Safari에서 테스트하고, 캐시가 갱신될 때까지 기다리면 OG 이미지가 제안 카드에 표시됩니다!

