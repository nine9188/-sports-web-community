# User Domain Documentation

> Last Updated: 2025-12-30

User 도메인은 사용자 프로필 조회, 활동 내역 표시, 레벨/경험치 시스템을 담당합니다.

## Quick Links

- [구조 개요](./structure.md)
- [컴포넌트 상세](./components.md)
- [서버 액션](./actions.md)
- [타입 정의](./types.md)
- [문제점 및 개선사항](./issues.md)
- [UI 재설계 가이드](./ui-redesign.md)

## 기능 요약

| 기능 | 상태 | 설명 |
|------|------|------|
| 공개 프로필 조회 | O | `/user/[publicId]` 페이지 |
| 프로필 모달 | O | 작성자 클릭 시 팝업 |
| 사용자 게시글 목록 | O | 페이지네이션 지원 |
| 사용자 댓글 목록 | O | 댓글 단 게시글 표시 |
| 레벨/경험치 시스템 | O | 49레벨까지, 진행률 표시 |
| 아이콘 시스템 | O | 레벨 기반 + 구매 아이콘 |

## 디렉토리 구조

```
src/
├── app/user/
│   └── [publicId]/
│       ├── page.tsx              # 프로필 페이지 (서버 컴포넌트)
│       └── UserActivityTabs.tsx  # 활동 탭 (클라이언트)
│
├── domains/user/
│   ├── actions/
│   │   ├── getPublicProfile.ts   # 프로필 조회
│   │   ├── getUserPosts.ts       # 게시글 목록
│   │   ├── getUserComments.ts    # 댓글 목록
│   │   └── index.ts
│   ├── components/
│   │   ├── AuthorLink.tsx        # 작성자 링크 (드롭다운)
│   │   ├── PublicProfileCard.tsx # 프로필 카드
│   │   ├── UserProfileModal.tsx  # 프로필 모달
│   │   ├── UserPostList.tsx      # 게시글 목록
│   │   ├── UserCommentList.tsx   # 댓글 목록
│   │   └── index.ts
│   ├── context/
│   │   └── UserProfileModalContext.tsx
│   └── types/
│       └── index.ts
│
└── shared/
    ├── components/
    │   └── UserIcon.tsx          # 사용자 아이콘
    └── utils/
        ├── level-icons.ts        # 클라이언트용 레벨 유틸
        └── level-icons-server.ts # 서버용 레벨 유틸
```

## 관련 도메인

- **settings**: 본인 프로필 수정, EXP/포인트 확인
- **boards**: PostList 컴포넌트 재사용
- **reports**: 신고 버튼 컴포넌트
