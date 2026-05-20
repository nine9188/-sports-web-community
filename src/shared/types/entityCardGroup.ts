import type { PlayerCardData } from './playerCard';
import type { TeamCardData } from './teamCard';

export type EntityCardGroupColumns = 1 | 2 | 3;

export type EntityCardGroupItem =
  | {
      type: 'team';
      id: string | number;
      data: TeamCardData;
    }
  | {
      type: 'player';
      id: string | number;
      data: PlayerCardData;
    };
