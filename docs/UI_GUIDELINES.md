# UI 디자인 시스템

## 1. 디자인 토큰

### 1.1 색상

#### 배경색
| 이름 | Light | Dark | 용도 |
|------|-------|------|------|
| **bg-primary** | `bg-white` | `dark:bg-[#1D1D1D]` | 메인 컨테이너, 카드 |
| **bg-secondary** | `bg-[#F5F5F5]` | `dark:bg-[#262626]` | 헤더, 비활성 탭 |
| **bg-tertiary** | `bg-[#EAEAEA]` | `dark:bg-[#333333]` | 호버, 활성 상태 |
| **bg-button** | `bg-[#262626]` | `dark:bg-[#3F3F3F]` | Primary 버튼 |
| **bg-button-hover** | `hover:bg-[#3F3F3F]` | `dark:hover:bg-[#4A4A4A]` | 버튼 호버 |

#### 텍스트 색상
| 이름 | Light | Dark | 용도 |
|------|-------|------|------|
| **text-primary** | `text-gray-900` | `dark:text-[#F0F0F0]` | 제목, 본문 |
| **text-secondary** | `text-gray-700` | `dark:text-gray-300` | 부제목 |
| **text-tertiary** | `text-gray-500` | `dark:text-gray-400` | 힌트, 비활성 |
| **text-accent** | `text-orange-600` | `dark:text-orange-400` | 댓글 수 [N] |

#### 테두리 색상
| 이름 | Light | Dark | 용도 |
|------|-------|------|------|
| **border-primary** | `border-black/7` | `dark:border-0` | 컨테이너 외곽 |
| **border-secondary** | `border-black/5` | `dark:border-white/10` | 구분선 |

#### 상태 색상
| 상태 | 배경 | 텍스트 |
|------|------|--------|
| **Success/Win** | `bg-green-100 dark:bg-green-900/30` | `text-green-800 dark:text-green-400` |
| **Warning/Draw** | `bg-yellow-100 dark:bg-yellow-900/30` | `text-yellow-800 dark:text-yellow-400` |
| **Error/Loss** | `bg-red-100 dark:bg-red-900/30` | `text-red-800 dark:text-red-400` |
| **Info** | `bg-blue-100 dark:bg-blue-900/30` | `text-blue-800 dark:text-blue-400` |

---

### 1.2 크기 체계

#### 아이콘 크기
| 이름 | 크기 | 용도 |
|------|------|------|
| **xs** | `w-4 h-4` | 인라인, 버튼 내부 |
| **sm** | `w-5 h-5` | 메뉴, 리스트 |
| **md** | `w-6 h-6` | 기본 아이콘 |
| **lg** | `w-8 h-8` | 강조 |
| **xl** | `w-10 h-10` | 대형 |

#### 폰트 크기
| 이름 | 크기 | 용도 |
|------|------|------|
| **xs** | `text-xs` (12px) | 메타정보, 날짜 |
| **sm** | `text-sm` (14px) | 본문, 버튼 |
| **base** | `text-base` (16px) | 큰 본문 |
| **lg** | `text-lg` (18px) | 섹션 제목 |
| **xl** | `text-xl` (20px) | 페이지 제목 |

#### 라운드
| 이름 | 크기 | 용도 |
|------|------|------|
| **sm** | `rounded` | 작은 버튼, 태그 |
| **md** | `rounded-md` | 입력 필드 |
| **lg** | `rounded-lg` | 카드, 컨테이너 |
| **full** | `rounded-full` | 아바타, 원형 버튼 |

---

### 1.3 간격 체계

#### Padding
| 용도 | 크기 |
|------|------|
| 버튼 | `px-4 py-2` |
| 카드 내부 | `p-4` |
| 컨테이너 헤더 | `px-4` (h-12) |
| 테이블 셀 | `px-3 py-2` |
| 리스트 아이템 | `px-2 py-1.5` |

#### Gap
| 용도 | 크기 |
|------|------|
| 버튼 그룹 | `gap-2` |
| 카드 그리드 | `gap-4` |
| 섹션 간 | `gap-6` |

---

## 2. 기본 요소

### 2.1 버튼

```tsx
{/* Primary */}
<button className="bg-[#262626] dark:bg-[#3F3F3F] text-white px-4 py-2 rounded-md hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] transition-colors">
  확인
</button>

{/* Secondary */}
<button className="bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] px-4 py-2 rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
  취소
</button>

{/* Ghost */}
<button className="text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
  더보기
</button>

{/* Danger */}
<button className="bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded-md hover:bg-red-700 dark:hover:bg-red-800 transition-colors">
  삭제
</button>
```

### 2.2 Input

```tsx
import { focusStyles, inputBaseStyles } from '@/shared/styles';
import { cn } from '@/shared/utils/cn';

<input
  type="text"
  placeholder="입력하세요"
  className={cn(
    'w-full px-3 py-2 rounded-md',
    inputBaseStyles,
    focusStyles
  )}
/>

{/* 또는 인라인 */}
<input
  type="text"
  placeholder="입력하세요"
  className="w-full px-3 py-2 rounded-md border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#EAEAEA] dark:focus:bg-[#333333] transition-colors"
/>
```

### 2.3 Select

```tsx
import { focusStyles, inputGrayBgStyles } from '@/shared/styles';

<select className={cn(
  'w-full px-3 py-2 rounded-md',
  inputGrayBgStyles,
  focusStyles
)}>
  <option>옵션 1</option>
  <option>옵션 2</option>
</select>
```

### 2.4 Textarea

```tsx
import { focusStyles, inputBaseStyles } from '@/shared/styles';

<textarea
  placeholder="내용을 입력하세요"
  rows={4}
  className={cn(
    'w-full px-3 py-2 rounded-md resize-none',
    inputBaseStyles,
    focusStyles
  )}
/>
```

### 2.5 Badge (스타일 상수)

> **스타일 상수 사용** - `@/shared/styles`에서 import

```tsx
import { badgeBaseStyles, badgeDefault, badgeSuccess, badgeWarning, badgeError, badgeInfo } from '@/shared/styles';

{/* Default */}
<span className={`${badgeBaseStyles} ${badgeDefault}`}>기본</span>

{/* Success */}
<span className={`${badgeBaseStyles} ${badgeSuccess}`}>성공</span>

{/* Warning */}
<span className={`${badgeBaseStyles} ${badgeWarning}`}>주의</span>

{/* Error */}
<span className={`${badgeBaseStyles} ${badgeError}`}>에러</span>

{/* Info */}
<span className={`${badgeBaseStyles} ${badgeInfo}`}>정보</span>
```

### 2.6 Avatar

```tsx
{/* Small */}
<div className="w-8 h-8 rounded-full bg-[#F5F5F5] dark:bg-[#262626] overflow-hidden">
  <img src="..." alt="avatar" className="w-full h-full object-cover" />
</div>

{/* Medium */}
<div className="w-10 h-10 rounded-full bg-[#F5F5F5] dark:bg-[#262626] overflow-hidden">
  <img src="..." alt="avatar" className="w-full h-full object-cover" />
</div>

{/* Large */}
<div className="w-12 h-12 rounded-full bg-[#F5F5F5] dark:bg-[#262626] overflow-hidden">
  <img src="..." alt="avatar" className="w-full h-full object-cover" />
</div>
```

### 2.7 Toggle / Switch

```tsx
const [on, setOn] = useState(false);

<button
  onClick={() => setOn(!on)}
  className={`relative w-11 h-6 rounded-full transition-colors ${
    on ? 'bg-[#262626] dark:bg-[#F0F0F0]' : 'bg-[#EAEAEA] dark:bg-[#333333]'
  }`}
>
  <div
    className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
      on
        ? 'translate-x-[22px] bg-white dark:bg-[#1D1D1D]'
        : 'translate-x-0.5 bg-white dark:bg-[#1D1D1D]'
    }`}
  />
</button>
```

### 2.8 Checkbox / Radio

```tsx
{/* Checkbox */}
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#262626] focus:ring-[#262626] dark:focus:ring-white/30 bg-white dark:bg-[#1D1D1D]"
  />
  <span className="text-sm text-gray-900 dark:text-[#F0F0F0]">라벨</span>
</label>

{/* Radio */}
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="radio"
    name="group"
    className="w-4 h-4 border-gray-300 dark:border-gray-600 text-[#262626] focus:ring-[#262626] dark:focus:ring-white/30 bg-white dark:bg-[#1D1D1D]"
  />
  <span className="text-sm text-gray-900 dark:text-[#F0F0F0]">옵션</span>
</label>
```

---

## 3. 복합 컴포넌트

### 3.1 Container (컴포넌트)

```tsx
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';

<Container>
  <ContainerHeader>
    <ContainerTitle>제목</ContainerTitle>
  </ContainerHeader>
  <div className="p-4">
    내용
  </div>
</Container>
```

**Container 스타일:**
- 배경: `bg-white dark:bg-[#1D1D1D]`
- 테두리: `border border-black/7 dark:border-0`
- 라운드: `rounded-lg`

**ContainerHeader 스타일:**
- 높이: `h-12`
- 배경: `bg-[#F5F5F5] dark:bg-[#262626]`
- 구분선: `border-b border-black/5 dark:border-white/10`

### 3.1.1 Card (스타일 상수)

> 단순 카드 레이아웃에는 스타일 상수를 사용합니다.

```tsx
import { cardStyles, cardHeaderStyles, cardTitleStyles, cardContentStyles, cardSimpleStyles } from '@/shared/styles';

{/* 헤더 포함 Card */}
<div className={cardStyles}>
  <div className={cardHeaderStyles}>
    <h3 className={cardTitleStyles}>제목</h3>
  </div>
  <div className={cardContentStyles}>내용</div>
</div>

{/* 단순 Card */}
<div className={cardSimpleStyles}>
  <p>내용</p>
</div>
```

### 3.2 Modal

```tsx
{/* Overlay */}
<div className="fixed inset-0 bg-black/50 z-50" />

{/* Modal */}
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="w-full max-w-md bg-white dark:bg-[#1D1D1D] rounded-lg shadow-xl">
    {/* Header */}
    <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/10">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">제목</h3>
      <button className="p-1 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333]">
        <X className="w-5 h-5" />
      </button>
    </div>
    {/* Body */}
    <div className="p-4">
      내용
    </div>
    {/* Footer */}
    <div className="flex justify-end gap-2 px-4 py-3 border-t border-black/5 dark:border-white/10">
      <button className="...">취소</button>
      <button className="...">확인</button>
    </div>
  </div>
</div>
```

### 3.3 Dropdown

```tsx
const [open, setOpen] = useState(false);

<div className="relative">
  {/* Trigger */}
  <button
    onClick={() => setOpen(!open)}
    className="flex items-center gap-2 bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 px-4 py-2 rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
  >
    메뉴
    <ChevronDown className="w-4 h-4" />
  </button>

  {/* Menu */}
  {open && (
    <div className="absolute top-full mt-1 w-48 bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg shadow-lg overflow-hidden z-10">
      <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]">
        항목 1
      </button>
      <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]">
        항목 2
      </button>
    </div>
  )}
</div>
```

**Dropdown 규칙:**
- **위치**: `absolute top-full mt-1` (트리거 바로 아래)
- **너비**: `w-48` (192px) 또는 `min-w-[200px]`
- **z-index**: `z-10` 이상
- **그림자**: `shadow-lg`
- **아이템 높이**: `py-2` (일관된 클릭 영역)
- **부모 컨테이너**: `overflow-hidden` 없어야 함 (잘림 방지)

### 3.4 Table

```tsx
<table className="w-full">
  <thead>
    <tr className="border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
      <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">제목</th>
      <th className="px-3 py-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">날짜</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-black/5 dark:border-white/10 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
      <td className="px-3 py-2 text-sm text-gray-900 dark:text-[#F0F0F0]">내용</td>
      <td className="px-3 py-2 text-center text-xs text-gray-500 dark:text-gray-400">2026-01-18</td>
    </tr>
  </tbody>
</table>
```

### 3.5 Tabs

```tsx
import { Tabs, TabButton } from '@/shared/components/ui/tabs';

{/* Background 스타일 (기본) */}
<Tabs>
  <TabButton active={true}>탭 1</TabButton>
  <TabButton active={false}>탭 2</TabButton>
</Tabs>

{/* Underline 스타일 */}
<Tabs>
  <TabButton active={true} variant="underline">탭 1</TabButton>
  <TabButton active={false} variant="underline">탭 2</TabButton>
</Tabs>

{/* Fill 스타일 */}
<Tabs>
  <TabButton active={true} variant="fill">탭 1</TabButton>
  <TabButton active={false} variant="fill">탭 2</TabButton>
</Tabs>
```

### 3.6 Toast (react-toastify)

```tsx
import { toast } from 'react-toastify';

// 성공
toast.success('저장되었습니다');

// 에러
toast.error('오류가 발생했습니다');

// 경고
toast.warning('주의가 필요합니다');

// 정보
toast.info('참고 정보입니다');
```

**Toast 규칙:**
- 라이브러리: `react-toastify` 사용
- 위치: 우측 상단 또는 하단 중앙
- 자동 닫힘: 3-5초
- 사용자 액션 결과에만 사용 (저장, 삭제, 에러 등)

### 3.7 Tooltip

```tsx
<div className="relative group">
  <button>호버하세요</button>
  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-[#1D1D1D] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
    툴팁 내용
  </div>
</div>
```

**Tooltip 규칙:**
- **배경**: `bg-gray-900 dark:bg-[#1D1D1D]`
- **텍스트**: `text-xs text-white`
- **패딩**: `px-2 py-1`
- **위치**: 기본 `bottom-full` (위에 표시), 필요시 `top-full` (아래)
- **트리거**: `group-hover` 사용
- **전환**: `opacity-0 group-hover:opacity-100 transition-opacity`

### 3.8 Accordion

```tsx
const [open, setOpen] = useState(false);

<div className="border border-black/7 dark:border-white/10 rounded-lg overflow-hidden">
  {/* Header */}
  <button
    onClick={() => setOpen(!open)}
    className="w-full flex items-center justify-between px-4 py-3 bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
  >
    <span className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">제목</span>
    <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
  </button>

  {/* Content */}
  {open && (
    <div className="px-4 py-3 bg-white dark:bg-[#1D1D1D]">
      <p className="text-sm text-gray-700 dark:text-gray-300">내용</p>
    </div>
  )}
</div>
```

**Accordion 규칙:**
- **헤더 배경**: `bg-[#F5F5F5] dark:bg-[#262626]`
- **컨텐츠 배경**: `bg-white dark:bg-[#1D1D1D]`
- **아이콘 회전**: `transition-transform rotate-180`
- **테두리**: 전체를 감싸는 `border rounded-lg`

### 3.9 Popover

```tsx
const [open, setOpen] = useState(false);

<div className="relative">
  <button onClick={() => setOpen(!open)}>열기</button>

  {open && (
    <>
      {/* Backdrop (선택) */}
      <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

      {/* Popover */}
      <div className="absolute top-full mt-2 left-0 w-64 p-4 bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg shadow-lg z-20">
        <h4 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] mb-2">제목</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">설명 내용</p>
      </div>
    </>
  )}
</div>
```

**Popover 규칙:**
- Dropdown과 유사하지만 더 많은 콘텐츠 포함
- **너비**: `w-64` 이상 (콘텐츠에 따라)
- **패딩**: `p-4`
- **Backdrop**: 외부 클릭 닫기용 (선택)
- **z-index**: backdrop `z-10`, popover `z-20`

### 3.10 Alert (스타일 상수)

> **스타일 상수 사용** - `@/shared/styles`에서 import

```tsx
import {
  alertBaseStyles,
  alertBgSuccess, alertBgWarning, alertBgError, alertBgInfo,
  alertTextSuccess, alertTextWarning, alertTextError, alertTextInfo
} from '@/shared/styles';

{/* Success */}
<div className={`${alertBaseStyles} ${alertBgSuccess}`}>
  <Check className={`w-5 h-5 ${alertTextSuccess} flex-shrink-0`} />
  <p className={`text-sm ${alertTextSuccess}`}>성공 메시지</p>
</div>

{/* Error */}
<div className={`${alertBaseStyles} ${alertBgError}`}>
  <X className={`w-5 h-5 ${alertTextError} flex-shrink-0`} />
  <p className={`text-sm ${alertTextError}`}>에러 메시지</p>
</div>

{/* Warning */}
<div className={`${alertBaseStyles} ${alertBgWarning}`}>
  <AlertCircle className={`w-5 h-5 ${alertTextWarning} flex-shrink-0`} />
  <p className={`text-sm ${alertTextWarning}`}>경고 메시지</p>
</div>

{/* Info */}
<div className={`${alertBaseStyles} ${alertBgInfo}`}>
  <Info className={`w-5 h-5 ${alertTextInfo} flex-shrink-0`} />
  <p className={`text-sm ${alertTextInfo}`}>정보 메시지</p>
</div>
```

**Alert 규칙:**
- **레이아웃**: `flex items-start gap-3` (alertBaseStyles에 포함)
- **패딩**: `p-4`
- **라운드**: `rounded-lg`
- **아이콘**: 좌측에 `w-5 h-5 flex-shrink-0`
- Toast와 다름: 페이지에 고정 표시 (팝업 아님)

### 3.11 Error Box (페이지 에러)

> 전체 페이지 에러 표시용

```tsx
import { errorBoxStyles, errorTitleStyles, errorMessageStyles, errorLinkStyles } from '@/shared/styles';

<div className={errorBoxStyles}>
  <h2 className={errorTitleStyles}>오류가 발생했습니다</h2>
  <p className={errorMessageStyles}>페이지를 불러오는 중 문제가 발생했습니다.</p>
  <Link href="/" className={errorLinkStyles}>메인페이지로 이동</Link>
</div>
```

**Error Box 규칙:**
- **레이아웃**: 가운데 정렬 (`text-center`)
- **배경**: `bg-white dark:bg-[#1D1D1D]`
- **테두리**: `border border-black/7 dark:border-0`
- **패딩**: `p-6`

---

## 4. 상태

### 4.1 Hover / Active

```tsx
{/* 배경 호버 - 버튼, 아이콘, UI 컨트롤 */}
hover:bg-[#EAEAEA] dark:hover:bg-[#333333]

{/* 텍스트 링크 호버 - 네비게이션, 인라인 링크 */}
hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline

{/* 활성 상태 */}
bg-[#EAEAEA] dark:bg-[#333333]
```

**텍스트 링크 vs UI 컨트롤 구분:**
- **텍스트 링크**: 페이지 이동 링크, 네비게이션 → `hover:underline` 사용
- **UI 컨트롤**: 버튼, 드롭다운, 아이콘 버튼 → `hover:bg-*` 사용

### 4.2 Disabled

```tsx
<button disabled className="bg-[#EAEAEA] dark:bg-[#333333] text-gray-400 dark:text-gray-500 cursor-not-allowed">
  비활성
</button>

<input disabled className="bg-[#F5F5F5] dark:bg-[#262626] text-gray-400 dark:text-gray-500 cursor-not-allowed" />
```

### 4.3 Loading (Spinner)

```tsx
import Spinner from '@/shared/components/Spinner';

{/* 기본 */}
<Spinner />

{/* 크기 */}
<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />

{/* 버튼 내 로딩 */}
<button disabled className="...">
  <Spinner size="sm" className="mr-2" />
  처리 중...
</button>
```

### 4.4 Skeleton

> **공통 Skeleton 컴포넌트 사용** - `@/shared/components/skeletons`

```tsx
import {
  TextSkeleton, TextBlockSkeleton,
  AvatarSkeleton, CardSkeleton,
  ListSkeleton, GridSkeleton,
  TableSkeleton, ProfileSkeleton
} from '@/shared/components/skeletons';

{/* 텍스트 스켈레톤 */}
<TextSkeleton width="w-1/2" />
<TextBlockSkeleton lines={3} />

{/* 아바타 스켈레톤 */}
<AvatarSkeleton size="md" />

{/* 카드 스켈레톤 */}
<CardSkeleton hasHeader={true} lines={3} />

{/* 리스트 스켈레톤 */}
<ListSkeleton count={5} hasAvatar={false} />

{/* 그리드 스켈레톤 */}
<GridSkeleton count={12} cols={4} />

{/* 테이블 스켈레톤 */}
<TableSkeleton rows={5} cols={4} />

{/* 프로필 스켈레톤 */}
<ProfileSkeleton />
```

**또는 스타일 상수 직접 사용:**

```tsx
import { skeletonBase, skeletonText, skeletonHeader } from '@/shared/styles';

{/* 텍스트 스켈레톤 */}
<div className="space-y-2">
  <div className={`${skeletonText} w-3/4`} />
  <div className={`${skeletonText} w-full`} />
  <div className={`${skeletonText} w-5/6`} />
</div>

{/* 아바타 + 텍스트 스켈레톤 */}
<div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-full bg-[#F5F5F5] dark:bg-[#262626] animate-pulse" />
  <div className="flex-1 space-y-2">
    <div className={`${skeletonText} w-1/2`} />
    <div className={`${skeletonText} w-3/4 opacity-60`} />
  </div>
</div>
```

**Skeleton 규칙:**
- **배경색**: `bg-[#EAEAEA] dark:bg-[#333333]`
- **애니메이션**: `animate-pulse`
- **라운드**: 텍스트는 `rounded`, 원형은 `rounded-full`
- 실제 콘텐츠와 비슷한 크기/형태 유지

### 4.5 Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="w-16 h-16 mb-4 rounded-full bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
    <Inbox className="w-8 h-8 text-gray-400 dark:text-gray-500" />
  </div>
  <p className="text-gray-500 dark:text-gray-400 mb-4">데이터가 없습니다</p>
  <button className="...">새로 만들기</button>
</div>
```

### 4.6 Error State

```tsx
{/* Input 에러 */}
<div>
  <input className="... border-red-500 dark:border-red-400" />
  <p className="mt-1 text-xs text-red-600 dark:text-red-400">에러 메시지</p>
</div>

{/* Alert */}
<div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
  <p className="text-sm">에러가 발생했습니다.</p>
</div>
```

---

## 5. 금지 사항

### 색상
```css
/* ❌ 금지 */
dark:bg-gray-900, dark:bg-gray-800, dark:bg-zinc-900
bg-gray-100, bg-gray-200
hover:text-blue-*, hover:bg-blue-*

/* ✅ 사용 */
dark:bg-[#1D1D1D], dark:bg-[#262626], dark:bg-[#333333]
bg-[#F5F5F5], bg-[#EAEAEA]
hover:bg-[#EAEAEA], dark:hover:bg-[#333333]
```

### 호버
```css
/* ❌ 파란색 호버 금지 */
hover:text-blue-600
hover:bg-blue-50

/* ✅ 회색 계열만 */
hover:bg-[#EAEAEA] dark:hover:bg-[#333333]
```

### 버튼
```css
/* ❌ 혼용 금지 */
bg-gray-800 (slate-800과 혼용)
bg-black

/* ✅ 통일 */
bg-[#262626] dark:bg-[#3F3F3F]
```

---

## 6. 공통 UI 컴포넌트 (필수)

> **중요**: 아래 공통 컴포넌트가 있는 경우 반드시 사용해야 합니다.
> 인라인으로 직접 구현하지 마세요.

### 6.1 표준 Import 경로

```tsx
// ✅ 올바른 import
import { Button, Container, ContainerHeader, ContainerTitle, Pagination, Tabs, TabButton } from '@/shared/components/ui';
import Spinner from '@/shared/components/Spinner';

// ❌ 잘못된 import (사용 금지)
import { Button } from '@/shared/ui/button';  // 레거시
import Tabs from '@/shared/ui/tabs';          // 레거시
```

### 6.2 공통 컴포넌트 목록

| 컴포넌트 | 경로 | 용도 |
|----------|------|------|
| **Button** | `@/shared/components/ui` | 모든 버튼 |
| **Container** | `@/shared/components/ui` | 섹션 컨테이너 |
| **ContainerHeader** | `@/shared/components/ui` | 컨테이너 헤더 |
| **ContainerTitle** | `@/shared/components/ui` | 컨테이너 제목 |
| **Pagination** | `@/shared/components/ui` | 페이지네이션 |
| **Select** | `@/shared/components/ui` | 드롭다운 선택 |
| **Tabs, TabButton** | `@/shared/components/ui` | 탭 UI |
| **Dialog** | `@/shared/components/ui` | 모달/다이얼로그 |
| **Spinner** | `@/shared/components/Spinner` | 로딩 스피너 |

### 6.3 스타일 상수로 대체된 요소

> 아래 요소들은 컴포넌트 대신 **스타일 상수**를 사용합니다.
> `@/shared/styles`에서 import하여 사용하세요.

| 요소 | 스타일 상수 | 용도 |
|------|-------------|------|
| **Badge** | `badgeBaseStyles`, `badgeSuccess`, etc. | 상태 뱃지 |
| **Card** | `cardStyles`, `cardSimpleStyles`, etc. | 카드 레이아웃 |
| **Alert** | `alertBaseStyles`, `alertBgError`, etc. | 인라인 알림 |
| **ErrorBox** | `errorBoxStyles`, `errorTitleStyles`, etc. | 페이지 에러 |

```tsx
// 예시: Badge
import { badgeBaseStyles, badgeSuccess } from '@/shared/styles';
<span className={`${badgeBaseStyles} ${badgeSuccess}`}>성공</span>

// 예시: Card
import { cardSimpleStyles } from '@/shared/styles';
<div className={cardSimpleStyles}>내용</div>

// 예시: Error Box
import { errorBoxStyles, errorTitleStyles, errorMessageStyles, errorLinkStyles } from '@/shared/styles';
<div className={errorBoxStyles}>
  <h2 className={errorTitleStyles}>오류</h2>
  <p className={errorMessageStyles}>메시지</p>
  <Link href="/" className={errorLinkStyles}>돌아가기</Link>
</div>
```

### 6.4 금지 사항

```tsx
// ❌ 인라인 PaginationButton 구현 금지
const PaginationButton = () => { ... }  // 직접 구현 금지!

// ✅ 공통 컴포넌트 사용
import { Pagination } from '@/shared/components/ui';
<Pagination currentPage={1} totalPages={10} onPageChange={setPage} mode="button" />
```

```tsx
// ❌ 자체 스피너 구현 금지
<div className="animate-spin border-2 ..." />  // 직접 구현 금지!

// ✅ Spinner 컴포넌트 사용
import Spinner from '@/shared/components/Spinner';
<Spinner size="md" />
```

```tsx
// ❌ Badge/Card 컴포넌트 사용 금지 (삭제됨)
import { Badge, Card } from '@/shared/components/ui';  // 존재하지 않음!

// ✅ 스타일 상수 사용
import { badgeBaseStyles, badgeSuccess, cardSimpleStyles } from '@/shared/styles';
<span className={`${badgeBaseStyles} ${badgeSuccess}`}>뱃지</span>
<div className={cardSimpleStyles}>카드</div>
```

### 6.5 레거시 폴더 (`@/shared/ui/`)

> ⚠️ `src/shared/ui/` 폴더는 레거시입니다.
> 새 코드에서는 사용하지 마세요.
> 기존 사용처는 점진적으로 마이그레이션합니다.

**예외**: `@/shared/ui/tiptap/`은 에디터 전용으로 유지됩니다.

자세한 마이그레이션 계획: [docs/refactoring/ui-migration.md](./refactoring/ui-migration.md)

---

## 7. 공유 스타일 상수

> **중요**: 입력 필드, 포커스, 호버 스타일은 `@/shared/styles`에서 import하여 사용합니다.

### 7.1 스타일 파일 구조

```
src/shared/styles/
├── index.ts      # 전체 re-export
├── focus.ts      # 포커스 스타일
├── input.ts      # 입력 필드 스타일
├── hover.ts      # 호버 스타일
├── badge.ts      # 뱃지 스타일
├── alert.ts      # 알림/에러박스 스타일
└── card.ts       # 카드 스타일
```

### 7.2 포커스 스타일 (focus.ts)

```tsx
// 입력 필드용 포커스 (배경색 변경 방식)
export const focusStyles = 'outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#EAEAEA] dark:focus:bg-[#333333]';

// 버튼용 포커스 (링 없음)
export const buttonFocusStyles = 'outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0';
```

**포커스 패턴 규칙:**
- ❌ `focus:ring-*` 사용 금지
- ✅ `focus:bg-[#EAEAEA] dark:focus:bg-[#333333]` 사용 (배경색 변경)

### 7.3 입력 필드 스타일 (input.ts)

```tsx
// 흰색 배경 (기본 Input)
export const inputBaseStyles = 'border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors';

// 회색 배경 (Textarea, Select)
export const inputGrayBgStyles = 'border border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors';

// disabled 상태
export const inputDisabledStyles = 'disabled:bg-[#EAEAEA] dark:disabled:bg-[#333333] disabled:cursor-not-allowed';
```

### 7.4 호버 스타일 (hover.ts)

```tsx
// 배경 호버
export const hoverStyles = 'hover:bg-[#EAEAEA] dark:hover:bg-[#333333]';

// 텍스트 호버
export const hoverTextStyles = 'hover:text-gray-700 dark:hover:text-gray-300';
```

### 7.5 뱃지 스타일 (badge.ts)

```tsx
// 기본 뱃지
export const badgeBaseStyles = 'px-2 py-0.5 text-xs rounded';

// 색상 variants
export const badgeDefault = 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300';
export const badgeSuccess = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
export const badgeWarning = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
export const badgeError = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
export const badgeInfo = 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';

// W/D/L 뱃지 (스포츠 결과용)
export const wdlBadgeBaseStyles = 'w-6 h-6 flex items-center justify-center rounded text-xs font-medium';
export const wdlWin = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
export const wdlDraw = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
export const wdlLose = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';

// 사용 예시
<span className={`${badgeBaseStyles} ${badgeSuccess}`}>성공</span>
<span className={`${wdlBadgeBaseStyles} ${wdlWin}`}>W</span>
```

### 7.6 알림/에러박스 스타일 (alert.ts)

```tsx
// 인라인 Alert (상태 메시지)
export const alertBaseStyles = 'flex items-start gap-3 p-4 rounded-lg';
export const alertBgSuccess = 'bg-green-100 dark:bg-green-900/30';
export const alertBgWarning = 'bg-yellow-100 dark:bg-yellow-900/30';
export const alertBgError = 'bg-red-100 dark:bg-red-900/30';
export const alertBgInfo = 'bg-blue-100 dark:bg-blue-900/30';
export const alertTextSuccess = 'text-green-800 dark:text-green-400';
export const alertTextWarning = 'text-yellow-800 dark:text-yellow-400';
export const alertTextError = 'text-red-800 dark:text-red-400';
export const alertTextInfo = 'text-blue-800 dark:text-blue-400';

// 페이지 레벨 Error Box (전체 페이지 에러용)
export const errorBoxStyles = 'bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 p-6 text-center';
export const errorTitleStyles = 'text-xl font-semibold mb-3 text-gray-900 dark:text-[#F0F0F0]';
export const errorMessageStyles = 'text-sm text-gray-700 dark:text-gray-300 mb-4';
export const errorLinkStyles = 'inline-block bg-[#262626] dark:bg-[#3F3F3F] text-white hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] px-4 py-2 rounded text-sm transition-colors';

// 인라인 Alert 사용 예시
<div className={`${alertBaseStyles} ${alertBgError}`}>
  <X className={`w-5 h-5 ${alertTextError} flex-shrink-0`} />
  <p className={`text-sm ${alertTextError}`}>에러 메시지</p>
</div>

// Error Box 사용 예시 (페이지 에러)
<div className={errorBoxStyles}>
  <h2 className={errorTitleStyles}>오류가 발생했습니다</h2>
  <p className={errorMessageStyles}>페이지를 불러오는 중 문제가 발생했습니다.</p>
  <Link href="/" className={errorLinkStyles}>메인페이지로 이동</Link>
</div>
```

### 7.7 카드 스타일 (card.ts)

```tsx
// 기본 Card (헤더 포함)
export const cardStyles = 'rounded-lg bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] border border-black/5 dark:border-0 overflow-hidden';
export const cardHeaderStyles = 'flex flex-col space-y-1.5 px-6 py-4 bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg';
export const cardTitleStyles = 'text-2xl font-semibold leading-none tracking-tight';
export const cardDescriptionStyles = 'text-sm text-gray-500 dark:text-gray-400';
export const cardContentStyles = 'p-6 pt-0';
export const cardFooterStyles = 'flex items-center p-6 pt-0';

// Simple Card (단순 컨테이너)
export const cardSimpleStyles = 'rounded-lg bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] border border-black/5 dark:border-0 p-6';

// 사용 예시 (헤더 포함)
<div className={cardStyles}>
  <div className={cardHeaderStyles}>
    <h3 className={cardTitleStyles}>제목</h3>
    <p className={cardDescriptionStyles}>설명</p>
  </div>
  <div className={cardContentStyles}>내용</div>
</div>

// 사용 예시 (단순 컨테이너)
<div className={cardSimpleStyles}>
  <p>내용</p>
</div>
```

### 7.8 사용 예시

```tsx
import { focusStyles, inputBaseStyles, hoverStyles } from '@/shared/styles';
import { cn } from '@/shared/utils/cn';

// 기본 Input
<input className={cn('w-full px-3 py-2 rounded-md', inputBaseStyles, focusStyles)} />

// 에러 상태 Input (조건부 border)
<input className={cn(
  'w-full px-3 py-2 rounded-md',
  hasError ? 'border border-red-500' : inputBaseStyles,
  focusStyles
)} />

// 호버 가능한 버튼
<button className={cn('px-4 py-2 rounded-md', hoverStyles)}>
  클릭
</button>
```

---

## 8. 참조

- **UI 쇼케이스**: `/ui` 페이지에서 모든 컴포넌트/스타일 확인 가능
- **공통 컴포넌트**: `src/shared/components/ui/`
- **공유 스타일 상수**: `src/shared/styles/`
- **Spinner**: `src/shared/components/Spinner.tsx`
- **마이그레이션 가이드**: `docs/refactoring/ui-migration.md`

### 8.1 스타일 상수 요약

| 파일 | 주요 export |
|------|------------|
| `focus.ts` | `focusStyles`, `buttonFocusStyles` |
| `input.ts` | `inputBaseStyles`, `inputGrayBgStyles` |
| `hover.ts` | `hoverStyles`, `hoverTextStyles` |
| `badge.ts` | `badgeBaseStyles`, `badgeSuccess`, `wdlWin` 등 |
| `alert.ts` | `alertBaseStyles`, `alertBgError`, `errorBoxStyles` 등 |
| `card.ts` | `cardStyles`, `cardSimpleStyles` 등 |
| `skeleton.ts` | `skeletonBase`, `skeletonText`, `skeletonHeader` 등 |

---

*마지막 업데이트: 2026-01-19*
