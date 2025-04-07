export interface Match {
  id: number;
  status: {
    code: string;
    name: string;
  };
  time: {
    date: string;
    time: number | null;
  };
  league: {
    id: number;
    name: string;
    country_name?: string;
    country_flag?: string;
    country?: string;
    logo?: string;
    flag?: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      img: string;
      score: number | null;
      form: string;
      formation?: string;
    };
    away: {
      id: number;
      name: string;
      img: string;
      score: number | null;
      form: string;
      formation?: string;
    };
  };
}
