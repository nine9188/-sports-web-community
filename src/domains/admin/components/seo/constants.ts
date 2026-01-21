import type { PredefinedPage } from './types';

// 지원하는 페이지 목록 (기본값 포함)
export const PREDEFINED_PAGES: PredefinedPage[] = [
  // 메인
  { path: '/', name: '메인', defaultTitle: '4590 Football', defaultDescription: '축구 팬들을 위한 커뮤니티. 실시간 라이브스코어, 게시판, 이적시장 정보를 확인하세요.' },

  // 게시판
  { path: '/boards/all', name: '전체글', defaultTitle: '전체글 - 4590 Football', defaultDescription: '모든 게시판의 최신 게시글을 한곳에서 확인하세요.' },
  { path: '/boards/popular', name: '인기글', defaultTitle: '인기글 - 4590 Football', defaultDescription: '가장 인기 있는 게시글을 확인하세요. 좋아요가 많은 순서로 정렬됩니다.' },

  // 라이브스코어
  { path: '/livescore/football', name: '라이브스코어', defaultTitle: '라이브스코어 - 4590 Football', defaultDescription: '실시간 축구 경기 결과와 일정을 확인하세요. 전 세계 주요 리그 경기를 한눈에.' },
  { path: '/livescore/football/leagues', name: '데이터센터', defaultTitle: '데이터센터 - 4590 Football', defaultDescription: '전 세계 주요 축구 리그 목록을 확인하고 원하는 리그의 팀 정보와 경기 결과를 확인하세요.' },

  // 기타 메인 기능
  { path: '/shop', name: '상점', defaultTitle: '상점 - 4590 Football', defaultDescription: '포인트로 다양한 아이템을 구매하세요. 아이콘, 닉네임 변경권 등.' },
  { path: '/transfers', name: '이적시장', defaultTitle: '이적시장 - 4590 Football', defaultDescription: '최신 축구 이적 소식, 영입 정보, 방출 소식을 실시간으로 확인하세요.' },
  { path: '/search', name: '검색', defaultTitle: '검색 - 4590 Football', defaultDescription: '게시글, 댓글, 팀 정보를 통합 검색하세요.' },

  // 알림
  { path: '/notifications', name: '알림', defaultTitle: '알림 - 4590 Football', defaultDescription: '실시간 알림을 확인하세요.' },

  // 설정
  { path: '/settings', name: '설정', defaultTitle: '설정 - 4590 Football', defaultDescription: '계정 설정 및 개인 정보를 관리합니다.' },
  { path: '/settings/profile', name: '프로필 설정', defaultTitle: '프로필 설정 - 4590 Football', defaultDescription: '프로필 및 계정 정보를 관리합니다.' },
  { path: '/settings/password', name: '비밀번호 변경', defaultTitle: '비밀번호 변경 - 4590 Football', defaultDescription: '비밀번호를 변경합니다.' },
  { path: '/settings/points', name: '포인트 내역', defaultTitle: '포인트 내역 - 4590 Football', defaultDescription: '포인트 적립 및 사용 내역을 확인하세요.' },
  { path: '/settings/exp', name: '경험치 내역', defaultTitle: '경험치 내역 - 4590 Football', defaultDescription: '레벨 및 경험치 획득 내역을 확인하세요.' },
  { path: '/settings/my-posts', name: '내 게시글', defaultTitle: '내 게시글 - 4590 Football', defaultDescription: '내가 작성한 게시글을 확인하세요.' },
  { path: '/settings/my-comments', name: '내 댓글', defaultTitle: '내 댓글 - 4590 Football', defaultDescription: '내가 작성한 댓글을 확인하세요.' },
  { path: '/settings/icons', name: '아이콘 설정', defaultTitle: '아이콘 설정 - 4590 Football', defaultDescription: '프로필 아이콘을 변경합니다.' },
  { path: '/settings/phone', name: '전화번호 설정', defaultTitle: '전화번호 설정 - 4590 Football', defaultDescription: '전화번호를 관리합니다.' },
  { path: '/settings/account-delete', name: '계정 탈퇴', defaultTitle: '계정 탈퇴 - 4590 Football', defaultDescription: '계정 탈퇴를 진행합니다.' },

  // 약관
  { path: '/terms', name: '이용약관', defaultTitle: '이용약관 - 4590 Football', defaultDescription: '4590 Football 서비스 이용약관을 확인하세요.' },
  { path: '/privacy', name: '개인정보처리방침', defaultTitle: '개인정보처리방침 - 4590 Football', defaultDescription: '4590 Football 개인정보처리방침을 확인하세요.' },

  // 인증 페이지
  { path: '/signin', name: '로그인', defaultTitle: '로그인 - 4590 Football', defaultDescription: '4590 Football 로그인 페이지입니다.' },
  { path: '/signup', name: '회원가입', defaultTitle: '회원가입 - 4590 Football', defaultDescription: '4590 Football 회원가입 페이지입니다.' },
  { path: '/social-signup', name: '소셜 회원가입', defaultTitle: '소셜 회원가입 - 4590 Football', defaultDescription: 'SNS 계정으로 회원가입을 진행합니다.' },
  { path: '/help/account-recovery', name: '계정 찾기', defaultTitle: '계정 찾기 - 4590 Football', defaultDescription: '아이디/비밀번호 찾기 페이지입니다.' },
  { path: '/help/account-found', name: '계정 찾기 완료', defaultTitle: '계정 찾기 완료 - 4590 Football', defaultDescription: '계정 찾기 결과 안내 페이지입니다.' },
  { path: '/help/reset-password', name: '비밀번호 재설정', defaultTitle: '비밀번호 재설정 - 4590 Football', defaultDescription: '비밀번호 재설정 페이지입니다.' },
  { path: '/auth/confirmed', name: '이메일 인증 완료', defaultTitle: '이메일 인증 완료 - 4590 Football', defaultDescription: '이메일 인증 완료 안내 페이지입니다.' },
];
