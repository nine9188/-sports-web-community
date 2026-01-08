# UI Icons

BoardQuickLinksWidget에서 사용하는 UI 아이콘들을 관리합니다.

## 📁 파일 목록

| 파일명 | 크기 | 용도 | 게시판/페이지 | 라벨 |
|--------|------|------|---------------|------|
| `ai.png` | 12KB | AI 분석 게시판 아이콘 | `/boards/ai-analysis` | "분석" |
| `live.png` | 17KB | 라이브스코어 아이콘 | `/livescore/football` | "라이브" |
| `news.png` | 17KB | 소식 게시판 아이콘 | `/boards/news` | "소식" |
| `notice.png` | 18KB | 공지 게시판 아이콘 | `/boards/notice` | "공지" |
| `post.png` | 11KB | 전체글 아이콘 | `/boards/all` | "전체" |
| `popular.png` | 12KB | 인기글 아이콘 | `/boards/popular` | "인기" |

---

## 🎨 디자인 사양

### 공통 스타일
- **형식**: PNG (투명 배경)
- **크기**: 약 28x28px (모바일), 20x20px (데스크톱)
- **색상**: 단색 또는 심플한 아이콘 권장
- **배경**: 투명

### 다크모드 대응
코드에서 `dark:invert` 클래스가 적용되므로:
- **현재**: 검은색/어두운 계열 아이콘 사용 (라이트모드 기준)
- **다크모드**: 자동으로 색상 반전 (흰색/밝은 계열로 변환)

---

## 📍 사용 위치

### BoardQuickLinksWidget
- **파일**: `src/domains/widgets/components/board-quick-links-widget/BoardQuickLinksWidget.tsx`
- **위치**:
  - 모바일: 메인 페이지 상단 (6칸 그리드)
  - 데스크톱: 헤더 하단 (6칸 가로 배치)

### 표시 방식
```tsx
// 모바일: 아이콘 박스 (48x48) + 텍스트
<Image src="/icons/popular.png" width={28} height={28} />

// 데스크톱: 아이콘 (20x20) + 텍스트 (가로 배치)
<Image src="/icons/popular.png" width={20} height={20} />
```

---

## 🔧 아이콘 추가/변경 방법

### 1. 기존 아이콘 변경
```bash
# 새 아이콘 파일로 교체
cp new-icon.png /public/icons/popular.png
```

### 2. 새 아이콘 추가
1. 파일 추가: `/public/icons/[new-icon].png`
2. 코드 수정: `BoardQuickLinksWidget.tsx`의 `DEFAULT_ITEMS` 배열에 추가
```tsx
const DEFAULT_ITEMS: QuickLinkItem[] = [
  // ... 기존 항목들
  {
    key: 'new-board',
    label: '새 게시판',
    href: '/boards/new-board',
    iconImage: '/icons/new-icon.png',
    ariaLabel: '새 게시판'
  },
];
```

### 3. 확인 사항
- [ ] 모바일에서 아이콘 표시 확인
- [ ] 데스크톱에서 아이콘 표시 확인
- [ ] 라이트모드 확인
- [ ] 다크모드 확인 (색상 반전)
- [ ] 호버 효과 확인

---

## 🎯 디자인 가이드

### 아이콘 스타일
- **선명도**: 명확하고 직관적인 형태
- **일관성**: 모든 아이콘이 동일한 스타일로 통일
- **단순성**: 복잡한 디테일보다는 심플한 형태
- **크기**: 24x24 ~ 32x32px 사이 권장

### 색상 가이드
- **라이트모드**: 어두운 색상 (#000000 ~ #333333)
- **다크모드**: 자동 반전 → 밝은 색상
- **추천**: 단색 아이콘 (색상 반전 시 자연스러움)

### 최적화
- TinyPNG 등으로 파일 크기 최소화
- 목표: 10KB ~ 20KB 이하

---

## 📝 참조 코드

**사용 파일**:
- `src/domains/widgets/components/board-quick-links-widget/BoardQuickLinksWidget.tsx`

**경로 설정**:
```tsx
const DEFAULT_ITEMS: QuickLinkItem[] = [
  { key: 'popular', label: '인기', href: '/boards/popular', iconImage: '/icons/popular.png', ariaLabel: '인기 게시판' },
  { key: 'all', label: '전체', href: '/boards/all', iconImage: '/icons/post.png', ariaLabel: '전체 게시판' },
  { key: 'notice', label: '공지', href: '/boards/notice', iconImage: '/icons/notice.png', ariaLabel: '공지 게시판' },
  { key: 'news', label: '소식', href: '/boards/news', iconImage: '/icons/news.png', ariaLabel: '소식 게시판' },
  { key: 'analysis', label: '분석', href: '/boards/ai-analysis', iconImage: '/icons/ai.png', ariaLabel: 'AI 분석 게시판' },
  { key: 'live', label: '라이브', href: '/livescore/football', iconImage: '/icons/live.png', ariaLabel: '라이브 스코어' },
];
```

---

**마지막 업데이트**: 2026-01-08
