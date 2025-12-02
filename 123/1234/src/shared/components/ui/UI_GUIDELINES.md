# UI 공통 가이드라인

이 문서는 프로젝트 전체에서 일관된 UI/UX를 유지하기 위한 공통 디자인 시스템 가이드입니다.

## 색상 체계

### 기본 배경색

#### Primary Container (메인 컨테이너)
```css
bg-white dark:bg-[#1D1D1D]
```
- 위젯, 카드 등 주요 컨테이너의 기본 배경색
- 테두리: `border border-black/7 dark:border-0`
- 라운드: `rounded-lg`

#### Secondary Container (헤더, 서브 컨테이너)
```css
bg-[#F5F5F5] dark:bg-[#262626]
```
- ContainerHeader 배경색
- 탭 버튼 비활성 상태
- 아이콘 컨테이너 배경색

#### Tertiary Container (인풋, 비활성 영역)
```css
bg-[#EAEAEA] dark:bg-[#333333]
```
- 호버 시 배경색
- 비활성화된 입력 필드

### 텍스트 색상

#### Primary Text (기본 텍스트)
```css
text-gray-900 dark:text-[#F0F0F0]
```
- 본문, 제목 등 주요 텍스트

#### Secondary Text (보조 텍스트)
```css
text-gray-700 dark:text-gray-300
```
- 부제목, 설명 등 보조 텍스트

#### Tertiary Text (비활성/힌트 텍스트)
```css
text-gray-500 dark:text-gray-400
```
- 힌트 텍스트, 비활성 상태 텍스트

### 테두리 색상

#### Primary Border (기본 테두리)
```css
border-black/7 dark:border-white/0
```
- 컨테이너 외곽선
- 섹션 구분선

#### Secondary Border (강조 테두리)
```css
border-black/5 dark:border-white/10
```
- 테이블 행 구분선
- 서브 섹션 구분선

## 인터랙션 패턴

### 호버 효과

#### 버튼/링크 호버 (배경 변화)
```css
hover:bg-[#EAEAEA] dark:hover:bg-[#333333]
```
- **사용처**: 리스트 아이템, 버튼, 클릭 가능한 링크
- **예시**: 게시글 목록, 팀 순위표 행, 네비게이션 버튼
- 전체 영역에 배경색이 변하여 클릭 가능함을 명확히 표시

#### 텍스트 링크 호버 (텍스트 색상 변화)
```css
hover:text-gray-600 dark:hover:text-gray-300
```
- **사용처**: 인라인 텍스트 링크 (배경 호버가 부적절한 경우)
- **예시**: Underline 스타일 탭 버튼 비활성 상태
- 텍스트만 있고 배경이 없는 경우 사용

#### 이미지 링크 호버 (밑줄 표시)
```css
group-hover:underline
```
- **사용처**: 이미지 + 텍스트 조합 링크에서 텍스트에 적용
- **예시**: 썸네일 이미지 아래 제목 텍스트
- 이미지는 효과 없이 그대로, 텍스트만 밑줄로 호버 표시
- **금지**: `group-hover:scale-105`, `group-hover:opacity-80` 등 이미지 변형 효과

#### 활성 탭 버튼
```css
text-gray-900 dark:text-[#F0F0F0]
border-b-2 border-gray-900 dark:border-[#F0F0F0]
```
- 현재 선택된 탭을 나타냄
- 하단 테두리로 활성 상태 표시

#### 비활성 탭 버튼
```css
bg-[#F5F5F5] dark:bg-[#262626]
text-gray-700 dark:text-gray-300
hover:bg-[#EAEAEA] dark:hover:bg-[#333333]
```
- 선택되지 않은 탭
- 호버 시 배경색 변화

### 트랜지션
```css
transition-colors
```
- 모든 색상 변화에 적용하여 부드러운 전환 효과

### 포커스 스타일
```css
outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0
```
- **사용처**: 모든 인터랙티브 요소 (버튼, 입력 필드, 링크 등)
- 기본 포커스 링을 제거하고 배경색/테두리 변화로 포커스 상태 표시
- 포커스 시 배경색 변화와 조합하여 사용

**입력 필드 예시:**
```tsx
<input
  className="outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0
    focus:bg-[#EAEAEA] dark:focus:bg-[#333333]"
/>
```

**버튼 예시:**
```tsx
<button
  className="outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0
    hover:bg-[#EAEAEA] dark:hover:bg-[#333333]"
>
  클릭
</button>
```

## 컴포넌트별 가이드

### Container & Header

**⚠️ 중요: 모든 컴포넌트 헤더는 반드시 `ContainerHeader` 컴포넌트를 사용해야 합니다.**

```tsx
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';

{/* ✅ 올바른 예시 - ContainerHeader 사용 */}
<Container className="bg-white dark:bg-[#1D1D1D]">
  <ContainerHeader>
    <ContainerTitle>제목</ContainerTitle>
  </ContainerHeader>
  <div className="px-4 py-3">
    내용...
  </div>
</Container>

{/* ❌ 잘못된 예시 - 직접 div로 작성 */}
<div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0">
  <div className="h-12 flex items-center px-4 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
    <h3 className="font-semibold text-sm text-gray-900 dark:text-[#F0F0F0]">제목</h3>
  </div>
</div>
```

**ContainerHeader 기본 스타일:**
- 높이: `h-12` (48px) - 모든 헤더 고정 높이
- 배경: `bg-[#F5F5F5] dark:bg-[#262626]` (Secondary Container)
- 구분선: `border-b border-black/5 dark:border-white/10` (Secondary Border)
- 정렬: `flex items-center px-4`
- 라운드: `md:rounded-t-lg`

**ContainerTitle 기본 스타일:**
- 폰트: `text-sm font-bold`
- 색상: `text-gray-900 dark:text-[#F0F0F0]` (Primary Text)

### 리스트 아이템 (클릭 가능)
```tsx
<Link
  href="..."
  className="text-sm text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-1.5 px-2 rounded"
>
  아이템 제목
</Link>
```

### 테이블 행 (클릭 가능)
```tsx
<tr className="hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer transition-colors border-b border-black/5 dark:border-white/10">
  <td>...</td>
</tr>
```

### 버튼
```tsx
{/* Primary Button */}
<button className="bg-slate-800 dark:bg-[#3F3F3F] text-white hover:bg-slate-700 dark:hover:bg-[#4A4A4A] px-4 py-2 rounded transition-colors">
  확인
</button>

{/* Secondary Button */}
<button className="bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] px-4 py-2 rounded transition-colors">
  취소
</button>
```

### 탭 버튼

**⚠️ 중요: 모든 탭 버튼의 높이는 `h-12` (48px)로 통일합니다.**

프로젝트에는 세 가지 탭 스타일이 있습니다:

#### 1. Underline 탭 (간단한 필터)
```tsx
import { Tabs, TabButton } from '@/shared/components/ui/tabs'

<Tabs>
  <TabButton active={isActive} variant="underline">탭 1</TabButton>
  <TabButton active={!isActive} variant="underline">탭 2</TabButton>
</Tabs>
```
- **사용처**: 게시판 카테고리, 간단한 필터
- **레이아웃**: 여백 있음 (`gap-4`)
- **활성**: 하단 테두리 + 진한 텍스트
- **비활성**: 텍스트만, 호버 시 텍스트 색 변화
- **예시**: BoardCollectionWidget 게시판 선택 탭

#### 2. Background 탭 (여백 있는 카테고리)
```tsx
import { Tabs, TabButton } from '@/shared/components/ui/tabs'

<Tabs>
  <TabButton active={isActive}>탭 1</TabButton>
  <TabButton active={!isActive}>탭 2</TabButton>
</Tabs>
```
- **사용처**: 데이터 뷰 전환, 여백 있는 카테고리 탭
- **레이아웃**: 여백 있음 (`gap-2`), rounded
- **활성**: 진한 배경 `bg-[#EAEAEA] dark:bg-[#333333]`
- **비활성**: 연한 배경 `bg-[#F5F5F5] dark:bg-[#262626]`, 호버 시 배경 변화

#### 3. Fill 탭 (공간 꽉 채우기)
```tsx
import { Tabs, TabButton } from '@/shared/components/ui/tabs'

<Tabs className="flex border-b border-black/5 dark:border-white/10">
  <TabButton active={isActive} variant="fill">EPL</TabButton>
  <TabButton active={!isActive} variant="fill">라리가</TabButton>
</Tabs>
```
- **사용처**: 리그 선택, 동일 너비로 분할이 필요한 탭
- **레이아웃**: 여백 없음 (`flex-1`로 균등 분할), 꽉 차는 호버
- **활성**: 투명 배경 `bg-white dark:bg-[#1D1D1D]` + 하단 테두리 `border-slate-800 dark:border-white`
- **비활성**: 연한 배경 `bg-[#F5F5F5] dark:bg-[#262626]`, 호버 시 배경 변화
- **특징**:
  - `flex-1`로 전체 공간을 균등 분할
  - 탭 사이 gap 없음 (버튼이 딱 붙어있음)
  - 호버 시 버튼 전체를 덮는 배경색
  - 활성 탭은 컨테이너와 같은 색 (투명처럼 보임) + 진한 하단 테두리
- **예시**: LeagueStandings 리그 선택 탭

**공통 탭 컴포넌트**:
- `src/shared/components/ui/tabs.tsx` - `TabButton` 컴포넌트 사용
- `variant` prop으로 세 가지 스타일 중 선택

### 아이콘 컨테이너 (라운드)
```tsx
<span
  className="w-12 h-12 bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-0 shadow-sm hover:bg-[#EAEAEA] hover:dark:bg-[#333333] transition-all"
  style={{ borderRadius: '0.5rem' }}
>
  <Icon />
</span>
```
- **주의**: 모바일에서 global CSS가 rounded 클래스를 override하므로 inline style 사용

### 이미지 + 텍스트 링크
```tsx
<Link href="..." className="group">
  <div className="relative rounded-lg overflow-hidden mb-2">
    <Image
      src="..."
      alt="..."
      fill
      className="object-cover group-hover:brightness-75 transition-all"
    />
  </div>
  <p className="text-gray-900 dark:text-[#F0F0F0] group-hover:underline transition-colors">
    제목 텍스트
  </p>
</Link>
```
- 이미지 호버 시 어두워지는 효과: `group-hover:brightness-75 transition-all`
- 텍스트는 밑줄로 호버 표시
- `group` 클래스로 링크 전체 호버 감지
- ❌ 금지: `scale`, `opacity` 등의 변형 효과

## 금지 사항

### ❌ 파란색 호버 사용 금지
```css
/* 사용하지 마세요 */
hover:text-blue-600
hover:bg-blue-50
```
- 파란색 호버는 일관성 없는 UI를 만듭니다
- 항상 회색 톤의 호버를 사용하세요

### ❌ 텍스트만 호버하는 링크 (배경이 있는 경우)
```css
/* 잘못된 예시 */
<Link className="hover:text-blue-600">글 제목</Link>

/* 올바른 예시 */
<Link className="hover:bg-[#EAEAEA] dark:hover:bg-[#333333] py-1.5 px-2 rounded">
  글 제목
</Link>
```

### ❌ 임의의 색상값 사용 금지
```css
/* 사용하지 마세요 */
bg-gray-100
dark:bg-gray-800
text-slate-600

/* 가이드라인의 정의된 색상을 사용하세요 */
bg-[#F5F5F5] dark:bg-[#262626]
text-gray-900 dark:text-[#F0F0F0]
```

## 반응형 디자인

### 모바일 전용 스타일
```tsx
max-md:bg-white max-md:dark:bg-[#1D1D1D]
```
- `max-md:` prefix로 모바일(768px 미만)에만 적용

### 데스크톱 전용 스타일
```tsx
hidden md:block
```
- `md:` prefix로 데스크톱(768px 이상)에만 적용

## 참고 컴포넌트

가이드라인이 올바르게 적용된 컴포넌트 예시:

### 공통 UI 컴포넌트
- `src/shared/components/ui/container.tsx` - Container 기본 구조
- `src/shared/components/ui/tabs.tsx` - 탭 버튼 (Underline/Background 스타일)

### 위젯 컴포넌트
- `src/domains/widgets/components/board-collection-widget/BoardCollectionWidgetClient.tsx`
  - 리스트 배경 호버
  - 이미지 + 텍스트 링크 (밑줄 호버)
  - Underline 탭 버튼
- `src/domains/widgets/components/board-quick-links-widget/BoardQuickLinksWidget.tsx`
  - 아이콘 컨테이너
  - 모바일/데스크톱 분기

### 사이드바 컴포넌트
- `src/domains/sidebar/components/league/LeagueStandings.tsx`
  - 테이블 행 호버
  - Background 탭 버튼

## 업데이트 로그

- 2025-01-XX: 초기 가이드라인 작성
- 배경 호버 패턴 표준화
- 파란색 호버 제거 정책 확립
