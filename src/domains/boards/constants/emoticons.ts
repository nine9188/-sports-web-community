export interface EmoticonRecord {
  id: string;
  name: string;
  code: string;
  url: string;
  packageId: string;
}

export interface EmoticonPackage {
  id: string;
  name: string;
  thumbnail: string;
}

// Twemoji SVG 기반 기본 이모티콘
const TWEMOJI_BASE = "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/";

export const EMOTICON_PACKAGES: EmoticonPackage[] = [
  { id: 'basic', name: '기본', thumbnail: `${TWEMOJI_BASE}1f600.svg` },
  { id: 'sports', name: '스포츠', thumbnail: `${TWEMOJI_BASE}26bd.svg` },
  { id: 'star', name: '인기', thumbnail: `${TWEMOJI_BASE}1f44d.svg` },
];

const BASIC_STICKERS = [
  // 1페이지 (24개)
  { name: '스마일', code: '1f600' },
  { name: '윙크', code: '1f609' },
  { name: '하트눈', code: '1f60d' },
  { name: '기쁨의 눈물', code: '1f602' },
  { name: '썬글라스', code: '1f60e' },
  { name: '메롱', code: '1f61b' },
  { name: '부끄럼', code: '1f60a' },
  { name: '파티', code: '1f973' },
  { name: '오열', code: '1f62d' },
  { name: '눈물', code: '1f622' },
  { name: '분노', code: '1f621' },
  { name: '비명', code: '1f631' },
  { name: '땀웃음', code: '1f605' },
  { name: '생각중', code: '1f914' },
  { name: '입막음', code: '1f92d' },
  { name: '메롱윙크', code: '1f61c' },
  { name: '멍함', code: '1f636' },
  { name: '졸림', code: '1f62a' },
  { name: '마스크', code: '1f637' },
  { name: '폭발', code: '1f92f' },
  { name: '어질어질', code: '1f974' },
  { name: '간절함', code: '1f97a' },
  { name: '침묵', code: '1f92b' },
  { name: '구토', code: '1f92e' },
  // 2페이지
  { name: '천사', code: '1f607' },
  { name: '악마', code: '1f608' },
  { name: '해골', code: '1f480' },
  { name: '유령', code: '1f47b' },
  { name: '외계인', code: '1f47d' },
  { name: '로봇', code: '1f916' },
  { name: '똥', code: '1f4a9' },
  { name: '광대', code: '1f921' },
  { name: '요정', code: '1f9da' },
  { name: '좀비', code: '1f9df' },
  { name: '눈하트', code: '1f970' },
  { name: '혀내밀기', code: '1f60b' },
  { name: '놀란입', code: '1f62e' },
  { name: '하품', code: '1f971' },
  { name: '취함', code: '1f975' },
  { name: '얼음', code: '1f976' },
  { name: '겁먹음', code: '1f628' },
  { name: '당황', code: '1f633' },
  { name: '화남', code: '1f624' },
  { name: '욕', code: '1f92c' },
  { name: '코자는', code: '1f634' },
  { name: '침흘림', code: '1f924' },
  { name: '끄덕끄덕', code: '1f60f' },
  { name: '의심', code: '1f928' },
];

const SPORTS_STICKERS = [
  { name: '축구', code: '26bd' },
  { name: '야구', code: '26be' },
  { name: '농구', code: '1f3c0' },
  { name: '미식축구', code: '1f3c8' },
  { name: '테니스', code: '1f3be' },
  { name: '배구', code: '1f3d0' },
  { name: '탁구', code: '1f3d3' },
  { name: '골프', code: '26f3' },
  { name: '볼링', code: '1f3b3' },
  { name: '배드민턴', code: '1f3f8' },
  { name: '스키', code: '26f7' },
  { name: '아이스하키', code: '1f3d2' },
  { name: '크리켓', code: '1f3cf' },
  { name: '복싱', code: '1f94a' },
  { name: '무술', code: '1f94b' },
  { name: '달리기', code: '1f3c3' },
  { name: '수영', code: '1f3ca' },
  { name: '역도', code: '1f3cb' },
  { name: '자전거', code: '1f6b4' },
  { name: '서핑', code: '1f3c4' },
  { name: '카약', code: '1f6a3' },
  { name: '승마', code: '1f3c7' },
  { name: '펜싱', code: '1f93a' },
  { name: '스케이트', code: '26f8' },
];

const STAR_STICKERS = [
  { name: '최고', code: '1f44d' },
  { name: '박수', code: '1f44f' },
  { name: '불', code: '1f525' },
  { name: '100점', code: '1f4af' },
  { name: '별', code: '2b50' },
  { name: '메달', code: '1f3c5' },
  { name: '트로피', code: '1f3c6' },
  { name: '짠/맥주', code: '1f37b' },
  { name: '하트', code: '2764' },
  { name: '폭죽', code: '1f389' },
  { name: '전구/아이디어', code: '1f4a1' },
  { name: '로켓', code: '1f680' },
  { name: '왕관', code: '1f451' },
  { name: '다이아', code: '1f48e' },
  { name: '선물', code: '1f381' },
  { name: '풍선', code: '1f388' },
  { name: '무지개', code: '1f308' },
  { name: '번개', code: '26a1' },
  { name: '눈송이', code: '2744' },
  { name: '해바라기', code: '1f33b' },
  { name: '네잎클로버', code: '1f340' },
  { name: '음표', code: '1f3b5' },
  { name: '마이크', code: '1f3a4' },
  { name: '카메라', code: '1f4f7' },
  { name: '편지', code: '1f48c' },
  { name: '축하', code: '1f38a' },
];

export const EMOTICONS: EmoticonRecord[] = [
  ...BASIC_STICKERS.map((sticker, i) => ({
    id: `emo_${i + 1}`,
    name: sticker.name,
    code: `~emo${i + 1}`,
    url: `${TWEMOJI_BASE}${sticker.code}.svg`,
    packageId: 'basic',
  })),
  ...SPORTS_STICKERS.map((sticker, i) => ({
    id: `spo_${i + 1}`,
    name: sticker.name,
    code: `~spo${i + 1}`,
    url: `${TWEMOJI_BASE}${sticker.code}.svg`,
    packageId: 'sports',
  })),
  ...STAR_STICKERS.map((sticker, i) => ({
    id: `star_${i + 1}`,
    name: sticker.name,
    code: `~star${i + 1}`,
    url: `${TWEMOJI_BASE}${sticker.code}.svg`,
    packageId: 'star',
  }))
];

// 성능 최적화: 모듈 로드 시 한 번만 생성
// ~emo10이 ~emo1보다 먼저 매칭되도록 코드 길이 내림차순 정렬
const sortedEmoticons = [...EMOTICONS].sort((a, b) => b.code.length - a.code.length);

export const EMOTICON_MAP = new Map<string, EmoticonRecord>(
  sortedEmoticons.map(e => [e.code, e])
);

const escapedCodes = sortedEmoticons.map(e => e.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
export const EMOTICON_REGEX = new RegExp(`(${escapedCodes.join('|')})`, 'g');
