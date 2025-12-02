export interface MatchData {
  id: string;
  teams?: {
    home?: { 
      name?: string; 
      logo?: string; 
      winner?: boolean 
    };
    away?: { 
      name?: string; 
      logo?: string; 
      winner?: boolean 
    };
  };
  goals?: { 
    home?: number; 
    away?: number 
  };
  league?: { 
    name?: string; 
    logo?: string; 
    id?: string | number;
  };
  status?: { 
    code?: string; 
    elapsed?: number; 
    name?: string 
  };
  time?: { 
    timestamp?: number 
  };
} 