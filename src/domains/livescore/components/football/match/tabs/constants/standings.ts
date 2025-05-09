interface LegendItem {
  condition: string;
  color: string;
  label: string;
}

interface CompetitionLegend {
  conditions: string[];
  items: LegendItem[];
}

export const STANDINGS_LEGENDS: Record<string, CompetitionLegend> = {
  championsLeague: {
    conditions: ['champions league'],
    items: [
      {
        condition: '1/8-finals',
        color: 'bg-green-600',
        label: '챔피언스리그 16강 진출'
      },
      {
        condition: '1/16-finals',
        color: 'bg-green-500',
        label: '챔피언스리그 32강 진출'
      },
      {
        condition: '',
        color: 'bg-green-400',
        label: '챔피언스리그 진출'
      }
    ]
  },
  europaLeague: {
    conditions: ['europa league'],
    items: [
      {
        condition: '1/8-finals',
        color: 'bg-blue-600',
        label: '유로파리그 16강 진출'
      },
      {
        condition: '1/16-finals',
        color: 'bg-blue-500',
        label: '유로파리그 32강 진출'
      },
      {
        condition: '',
        color: 'bg-blue-400',
        label: '유로파리그 진출'
      }
    ]
  },
  conferenceLeague: {
    conditions: ['conference league'],
    items: [
      {
        condition: '',
        color: 'bg-cyan-400',
        label: '컨퍼런스리그'
      }
    ]
  },
  relegation: {
    conditions: ['relegation'],
    items: [
      {
        condition: '',
        color: 'bg-red-400',
        label: '강등권'
      }
    ]
  }
}; 