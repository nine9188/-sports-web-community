import { NextResponse } from 'next/server';

const LLMS_TXT = `# 4590 Football

> 축구 팬이 모이는 한국어 커뮤니티 플랫폼. 실시간 라이브스코어, AI 경기 분석, 100개 이상의 팀별 게시판, 선수·팀 데이터를 무료로 제공합니다.

4590 Football은 "전반 45분 + 후반 45분 = 90분의 모든 순간을 함께한다"는 의미를 담은 축구 전문 커뮤니티입니다. 해외축구와 국내축구를 모두 다루며, 커뮤니티·라이브스코어·데이터 분석이 하나로 통합된 플랫폼입니다.

- 언어: 한국어
- 이용료: 무료
- URL: https://4590football.com

## 주요 기능

- [라이브스코어](https://4590football.com/livescore/football): 실시간 축구 경기 스코어, 일정, 결과 제공. EPL, 라리가, 세리에A, 분데스리가, 리그앙, K리그 등 40개 이상의 리그 지원
- [AI 경기 분석](https://4590football.com/boards/data-analysis): AI 모델이 과거 데이터, 팀 폼, 맞대결 기록을 분석하여 승률과 예상 스코어 제공
- [이적 시장](https://4590football.com/transfers): 최신 이적 소식과 루머 모아보기
- [포인트 상점](https://4590football.com/shop): 활동 포인트로 프로필 아이콘, 이모티콘 등 아이템 구매

## 커뮤니티 게시판

- [해외 축구](https://4590football.com/boards/soccer): 해외축구 전체 게시판 (프리미어리그, 라리가, 세리에A, 분데스리가, 리그앙 하위 게시판 포함)
- [국내 축구](https://4590football.com/boards/k-league): K리그 1, K리그 2 전체 팀 게시판
- [축구 소식](https://4590football.com/boards/news): 오피셜, 해외 뉴스, 국내 뉴스, 축구 정보
- [자유게시판](https://4590football.com/boards/free): 자유, 유머, 이슈, 질문, 정보/팁
- [핫딜](https://4590football.com/boards/hotdeal): 먹거리, 게임, PC, 가전, 패션 등 15개 카테고리
- [자유마켓](https://4590football.com/boards/market): 판매, 구매, 교환, 나눔, 공동구매 등
- [인증/후기](https://4590football.com/boards/review): 구매인증, 직관인증, 일반후기
- [창작](https://4590football.com/boards/creative): 팬아트, 움짤제작, 영상

## 해외 축구 리그별 게시판

- [프리미어리그](https://4590football.com/boards/premier): 리버풀, 아스널, 맨시티, 첼시, 토트넘, 맨유, 뉴캐슬 등 20개 팀 게시판
- [라리가](https://4590football.com/boards/laliga): 바르셀로나, 레알 마드리드, 아틀레티코, 비야레알 등 19개 팀 게시판
- [세리에A](https://4590football.com/boards/serie-a): AC밀란, 유벤투스, 인테르, 나폴리, AS로마 등 18개 팀 게시판
- [분데스리가](https://4590football.com/boards/bundesliga): 바이에른 뮌헨, 도르트문트, 레버쿠젠, 라이프치히 등 18개 팀 게시판
- [리그앙](https://4590football.com/boards/LIGUE1): PSG, 리옹, 마르세유, 모나코, 릴 등 18개 팀 게시판

## 국내 축구 게시판

- [K리그 1](https://4590football.com/boards/k-league-1): 울산, 전북, 서울, 인천, 포항, 제주 등 13개 팀 게시판
- [K리그 2](https://4590football.com/boards/k-league-2): K리그 2부 리그 팀 게시판

## 경기 데이터 분석

- [해외 축구 분석](https://4590football.com/boards/foreign-analysis): EPL, 라리가, 분데스리가, 세리에A, 리그앙 리그별 경기 분석
- [국내 축구 분석](https://4590football.com/boards/domestic-analysis): K리그 경기 분석

## 사이트 정보

- [소개](https://4590football.com/about): 4590 Football 소개 및 FAQ
- [가이드](https://4590football.com/guide): 사이트 이용 가이드
- [문의](https://4590football.com/contact): 연락처 및 문의
- [개인정보처리방침](https://4590football.com/privacy): 개인정보 처리 방침
- [이용약관](https://4590football.com/terms): 서비스 이용약관
`;

export async function GET() {
  return new NextResponse(LLMS_TXT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
