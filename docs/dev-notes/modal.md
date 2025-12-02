0) 목표

Day/Month/Year 뷰를 오가도 모달(팝오버) 크기는 고정.

내부 그리드만 재계산해 화면 깜빡임·점프 없음.

단일 날짜 선택 기준(확장: Range 가능).

1) 컴포넌트 구조

트리거: 입력박스 + 캘린더 아이콘 클릭 시 팝오버 오픈.

헤더: 이전/다음 화살표, 타이틀(클릭 시 상위 뷰로), 닫기(모바일 옵션).

바디: DayGrid | MonthGrid | YearGrid 중 하나.

푸터(선택): “오늘로 이동”, “초기화”.

2) 상태 & 전환(State Machine)

viewMode: 'day' | 'month' | 'year'

visibleDate: 패널이 보여주는 기준 날짜(연-월-일)

selectedDate: 선택 값(단일 날짜)

minDate, maxDate: 선택/내비 범위

전환 규칙

타이틀 클릭: day→month→year (상향)

YearGrid에서 “연” 클릭: month로 하향(해당 해)

MonthGrid에서 “월” 클릭: day로 하향(해당 월 1일 기준)

DayGrid에서 “일” 클릭: selectedDate 갱신, 기본은 닫기

좌/우 화살표:

day: 이전/다음 달

month: 이전/다음 해

year: 이전/다음 12년 묶음

(옵션) 아이콘 롱프레스 가속 이동

3) 모달 고정 레이아웃 스펙(핵심)

크기(권장)

Mobile S: W 320 × H 360

Desktop M: W 360 × H 360

패딩: 상하좌우 12px

헤더 높이: 40px / 헤더-바디 간격: 8px

푸터 높이(선택): 36px — 표시하지 않아도 공간은 예약(높이 흔들림 방지)

테두리/라운드/그림자: 일관

overflow: hidden (스크롤 불가)

애니메이션: 내부 컨텐츠만 전환, 모달 W/H 불변

내부 치수 계산(공식)
innerW  = modalW  - (paddingL + paddingR)
innerH  = modalH  - (paddingT + paddingB)
gridH_day   = innerH - header(40) - 8 - weekdayHeader(24) - 8 - footer(36?)
gridH_other = innerH - header(40) - 8 -                    0 - 8 - footer(36?)


간격 토큰: 4 / 8 / 12px만 사용(일관성)

4) 각 뷰 렌더 규칙
DayGrid

6행 × 7열 고정, 요일 헤더(24px)

firstDayOfWeek: 일/월 시작 옵션

격자 계산:

colGap=4, rowGap=4
cellW = floor((innerW  - colGap*(7-1)) / 7)
cellH = floor((gridH_day - rowGap*(6-1)) / 6)
cellSize = min(cellW, cellH)  // 정사각형 보장


월 채움: 시작 전/끝 후는 이전/다음 달 날짜로 채워 42칸 유지

현재월 외 날짜는 흐림(60~70% 투명), 클릭 시 해당 달로 전환 후 선택(옵션)

오늘: 얇은 테두리, 선택일: 채워진 배경

범위/규칙 불가 날짜: 비활성 + 포인터 금지

MonthGrid

3행 × 4열(12월), colGap=8, rowGap=8

계산:

tileW = floor((innerW       - 8*(4-1)) / 4)
tileH = floor((gridH_other  - 8*(3-1)) / 3)
tileSize = min(tileW, tileH)  // 정사각형


월 클릭 → DayGrid로 하향

YearGrid

3행 × 4열(12년 묶음), 계산은 Month와 동일

표시 구간: YYYYstart ~ YYYYend(12년)

좌측/우측 경계 해는 안내용 흐림 처리 가능

연 클릭 → MonthGrid로 하향

5) 헤더 & 타이틀

타이틀 포맷:

day: YYYY. M.

month: YYYY

year: YYYY1 ~ YYYY12

좌/우 네비 히트박스 ≥ 40×40px, 아이콘 16~20px

6) 입출력 & 제약(API 개념)

Props(개념)

value, defaultValue, onChange(date)

minDate, maxDate, firstDayOfWeek, locale

disabledDates?(d), highlightDates?(d), isHoliday?(d)

closeOnSelect(기본 true), showTodayButton(기본 true)

viewMode/defaultViewMode

이벤트

onOpen, onClose, onViewModeChange, onMonthChange, onYearRangeChange

7) 상호작용

마우스/터치: 셀/타일 클릭, 좌/우 스와이프(옵션), 롱프레스 가속(옵션)

키보드(a11y)

Day: ←/→ 하루, ↑/↓ 1주, Home/End 주의 처음/끝, PgUp/PgDn 달, Shift+Pg 1년, Enter 선택

Month/Year: 화살표로 이동, Enter 확정

Esc 닫기

포커스: 오픈 시 selectedDate 또는 오늘에 포커스. 뷰 전환 시 대응 셀로 포커스 매핑.

8) 접근성(A11y)

그리드: role="grid" / 셀: role="gridcell"

aria-selected, aria-disabled, 오늘 aria-current="date"

타이틀은 aria-live="polite"(월/연 변경 읽힘)

포커스 링 가시성 유지

9) 국제화/지역화

요일 라벨(한글/영문 축약), 첫 요일 설정, 윤년(2/29) 처리

공휴일/음력 등은 확장 훅으로 하이라이트 커스터마이즈

10) 애니메이션

뷰 전환: 페이드+슬라이드 120~180ms

이전/다음 이동: 수평 슬라이드 80~140ms

prefers-reduced-motion 존중(애니메이션 제거)

11) 엣지/정합성

날짜 계산은 UTC 자정 기준(타임존/DST 영향 최소화), 표시만 로컬

min/max 경계: 모든 뷰에서 비활성/내비 제한 일관

입력박스 수동 입력: 파싱 실패 → 에러(보더/헬프텍스트), 범위 밖 → 클램프 or 에러 유지(정책 선택)

12) 반응형

모바일 우선, 터치 타겟 ≥ 40px

바텀시트 모드(선택): 예) H 420px 고정 — 위 계산식의 modalH만 변경하면 동일 동작

13) 시각 토큰(일관)

오늘: 얇은 실선 테두리

선택: 채워진 배경 + 고대비 텍스트

외부월: 60~70% 투명

비활성: 40~50% 투명 + 커서 금지

주말: 서브톤 컬러

Hover/Active/Focus 상태 분리

14) 그리드 생성 알고리즘(요약)

DayGrid:

startOfMonth = YYYY-MM-01

startWeekIndex = (weekday(startOfMonth) - firstDayOfWeek + 7) % 7

gridStart = startOfMonth - startWeekIndex days

42칸 생성, 각 셀에 isToday/isCurrentMonth/isDisabled 등 플래그 계산

Year 묶음 시작년: visibleYear가 속한 12년 블록의 시작으로 정규화

15) QA 수락 기준(체크리스트)

뷰 전환(day↔month↔year) 시 모달 width/height 불변, 스크롤바 미노출

월/연/12년 내비 동작 정확, 키보드만으로 전 기능 사용 가능

min/max/disabledDates가 모든 뷰에서 일관 반영

오늘/선택/주말/외부월/비활성 시각 구분 명확

첫 요일(日/월) 변경 시 그리드 정합

모바일 바텀시트 모드에서 스와이프/닫기 제스처 정상

빠른 월 전환(연속 10회)에서도 프레임 드랍/깜빡임 없음