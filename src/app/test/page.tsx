import LiveScoreWidgetV2 from '@/domains/widgets/components/live-score-widget/LiveScoreWidgetV2';

// 임시 테스트 데이터
const mockLeagues = [
  {
    id: 'premier-league',
    name: '프리미어리그',
    leagueIdNumber: 39,
    logo: 'https://media.api-sports.io/football/leagues/39.png',
    matches: [
      {
        id: '1',
        homeTeam: {
          id: 33,
          name: '맨체스터 유나이티드',
          logo: 'https://media.api-sports.io/football/teams/33.png'
        },
        awayTeam: {
          id: 34,
          name: '뉴캐슬',
          logo: 'https://media.api-sports.io/football/teams/34.png'
        },
        score: {
          home: 2,
          away: 1
        },
        status: 'FT'
      },
      {
        id: '2',
        homeTeam: {
          id: 40,
          name: '리버풀',
          logo: 'https://media.api-sports.io/football/teams/40.png'
        },
        awayTeam: {
          id: 50,
          name: '맨체스터 시티',
          logo: 'https://media.api-sports.io/football/teams/50.png'
        },
        score: {
          home: 1,
          away: 1
        },
        status: 'LIVE'
      },
      {
        id: '3',
        homeTeam: {
          id: 49,
          name: '첼시',
          logo: 'https://media.api-sports.io/football/teams/49.png'
        },
        awayTeam: {
          id: 42,
          name: '아스널',
          logo: 'https://media.api-sports.io/football/teams/42.png'
        },
        score: {
          home: 0,
          away: 0
        },
        status: 'NS'
      }
    ]
  },
  {
    id: 'la-liga',
    name: '라리가',
    leagueIdNumber: 140,
    logo: 'https://media.api-sports.io/football/leagues/140.png',
    matches: [
      {
        id: '4',
        homeTeam: {
          id: 529,
          name: '바르셀로나',
          logo: 'https://media.api-sports.io/football/teams/529.png'
        },
        awayTeam: {
          id: 541,
          name: '레알 마드리드',
          logo: 'https://media.api-sports.io/football/teams/541.png'
        },
        score: {
          home: 2,
          away: 3
        },
        status: 'FT'
      },
      {
        id: '5',
        homeTeam: {
          id: 530,
          name: '아틀레티코 마드리드',
          logo: 'https://media.api-sports.io/football/teams/530.png'
        },
        awayTeam: {
          id: 728,
          name: '레알 소시에다드',
          logo: 'https://media.api-sports.io/football/teams/728.png'
        },
        score: {
          home: 1,
          away: 0
        },
        status: 'HT'
      }
    ]
  },
  {
    id: 'serie-a',
    name: '세리에A',
    leagueIdNumber: 135,
    logo: 'https://media.api-sports.io/football/leagues/135.png',
    matches: [
      {
        id: '6',
        homeTeam: {
          id: 489,
          name: '유벤투스',
          logo: 'https://media.api-sports.io/football/teams/489.png'
        },
        awayTeam: {
          id: 487,
          name: '인테르',
          logo: 'https://media.api-sports.io/football/teams/487.png'
        },
        score: {
          home: 0,
          away: 2
        },
        status: 'FT'
      }
    ]
  },
  {
    id: 'k-league',
    name: 'K리그1',
    icon: '⚽',
    matches: [
      {
        id: '7',
        homeTeam: {
          id: 2817,
          name: '울산 HD',
          logo: 'https://media.api-sports.io/football/teams/2817.png'
        },
        awayTeam: {
          id: 2820,
          name: '전북 현대',
          logo: 'https://media.api-sports.io/football/teams/2820.png'
        },
        score: {
          home: 3,
          away: 3
        },
        status: 'FT'
      },
      {
        id: '8',
        homeTeam: {
          id: 2832,
          name: '포항 스틸러스',
          logo: 'https://media.api-sports.io/football/teams/2832.png'
        },
        awayTeam: {
          id: 2830,
          name: 'FC 서울',
          logo: 'https://media.api-sports.io/football/teams/2830.png'
        },
        score: {
          home: 1,
          away: 2
        },
        status: 'LIVE'
      }
    ]
  }
];

export default function TestPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <h1 className="text-2xl font-bold mb-6">라이브스코어 위젯 V2 테스트</h1>

      {/* 정상 데이터 있을 때 */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">1. 경기 있을 때</h2>
        <LiveScoreWidgetV2 leagues={mockLeagues} />
      </div>

      {/* 경기 없을 때 */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">2. 경기 없을 때</h2>
        <LiveScoreWidgetV2 leagues={[]} />
      </div>

      {/* 빈 경기 리그 */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">3. 리그는 있지만 경기 없을 때</h2>
        <LiveScoreWidgetV2
          leagues={[
            {
              id: 'empty-premier',
              name: '프리미어리그',
              leagueIdNumber: 39,
              logo: 'https://media.api-sports.io/football/leagues/39.png',
              matches: []
            },
            {
              id: 'empty-laliga',
              name: '라리가',
              leagueIdNumber: 140,
              logo: 'https://media.api-sports.io/football/leagues/140.png',
              matches: []
            }
          ]}
        />
      </div>
    </div>
  );
}
