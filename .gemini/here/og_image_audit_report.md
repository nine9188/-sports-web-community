# OG 이미지 단일화 및 기기 제안 최적화 검토 보고서

사용자가 질문하신 3개의 OG 이미지(`og-image-v3.png`, `og-image-square.png`, `og-image.png`)가 어떻게 처리 및 단일화되었는지, 그리고 iPhone 및 메신저 제안 카드 최적화는 어떻게 적용되었는지에 대한 완료 보고서입니다.

---

## 1. 요약 및 처리 결과

* **`og-image-v3.png` 제거 및 `og-image.png` 단일화 완료**
  * 두 파일은 본래 동일한 파일(크기 및 MD5 해시값 일치)이었으므로 불필요한 `og-image-v3.png` 파일을 물리적으로 삭제하고 모든 설정과 기본 메타데이터가 **`og-image.png`**를 바라보도록 통일했습니다.
* **개별 페이지 제안 이미지 노출 오작동 방지 (iOS/Kakao 최적화)**
  * 개별 경기 상세 페이지나 글 상세 페이지 등 고유의 dynamic 이미지(예: 경기 스코어보드 이미지)가 있을 때, 메타데이터 빌더가 전역 로고 파일(fallback)을 다중 노출하지 않도록 수정했습니다.
  * 이제 고유 이미지가 존재하면 오직 해당 고유 이미지 1개만 `og:image` 태그로 전송되어 플랫폼(iOS Siri 제안, 카카오톡 등)에서 기본 로고로 잘못 매칭하는 현상이 원천 방지됩니다.
* **Apple Touch Icon 명시화**
  * 루트 레이아웃(`layout.tsx`)에 `apple-touch-icon` 태그를 규격에 맞춰 등록하여 iOS 기기에서 홈 화면 추가 및 즐겨찾기 시 아이콘이 명확하게 지정되도록 조치했습니다.

---

## 2. 세부 변경 사항

### ① 소스 코드 메타데이터 통일
* **참조 파일**: [`src/shared/config/site.ts`](file:///home/kim/web2/src/shared/config/site.ts)
  * `siteConfig.defaultOgImage`의 경로를 `/og-image-v3.png` ➔ `/og-image.png`로 수정 완료.
  * `getOgImage` 및 `getDefaultOgImageObject` 함수 내 기본 반환값을 `/og-image.png`로 수정 완료.
* **참조 파일**: [`public/og-image-v3.png`](file:///home/kim/web2/public/og-image-v3.png)
  * 사용하지 않게 된 `og-image-v3.png` 파일을 저장소에서 완전히 삭제 완료.

### ② 메신저 / 기기 링크 제안(Link Suggestions) 최적화
* **참조 파일**: [`src/shared/utils/metadataNew.ts`](file:///home/kim/web2/src/shared/utils/metadataNew.ts)
  * **기존 문제**: 개별 페이지용 고유 `image` 파라미터가 들어와도, `buildMetadata` 내부에서 전역 가로형(`og-image.png`) 및 정사각형(`og-image-square.png`) 이미지가 항상 함께 포함(fallback)되는 구조였습니다. 이로 인해 iOS Safari 제안이나 카카오톡 링크 카드 슬롯에 따라 엉뚱한 기본 이미지를 물고 오는 현상이 발생했습니다.
  * **수정 내역**: 고유 `image`가 입력된 경우 `includeDefaultOgFallbacks` 설정이 따로 작동하지 않는 이상 전역 fallback 이미지(`og-image.png`, `og-image-square.png`)를 메타데이터에서 제외시킵니다. 따라서 기기/플랫폼은 오직 해당 페이지 고유 이미지 단 하나만 수집하게 되어 잘못 매칭될 우려가 없습니다.
  * 고유 `image`가 지정되지 않은 전역 페이지(메인 홈 등)의 경우에만 가로형(`og-image.png`)과 iOS 대응용 정사각형(`og-image-square.png`) 이미지가 함께 제공됩니다.

### ③ Apple Touch Icon 설정 명시화
* **참조 파일**: [`src/app/layout.tsx`](file:///home/kim/web2/src/app/layout.tsx)
  * `icons` 설정 객체 하위에 `apple` 속성을 추가하여 `/apple-icon.png?v=20260613` 경로(180x180)를 수동 명시했습니다.
  * iOS 기기 즐겨찾기, Safari top-hit 검색 추천 시 제공되는 아이콘 규격이 명시화되었습니다.
  * *참고*: 현재 `apple-icon.png`는 흰색 단색 배경 위에 검정 로고가 얹혀진 형태입니다. 아이폰의 다크 모드 카드 또는 회색 계열 추천 UI 카드에 아이콘이 얹혀질 때 흰색 네모 테두리 박스가 아닌 투명 배경으로 깔끔하게 매칭하고 싶다면, `public/apple-icon.png` 이미지를 배경이 투명하게 처리된 PNG 파일로 교체하시는 것을 권장합니다.
