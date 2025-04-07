import { useState, useCallback } from 'react';

interface Match {
  id: number;
  status: {
    code: string;
    name: string;
  };
  time: {
    date: string;
    time: number;
  };
  league: {
    id: number;
    name: string;
    country_name: string;
    country_flag: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      score: number;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      score: number;
    };
  };
}

// API 호출 결과를 위한 타입
interface SoccersAPIResponse {
  success: boolean;
  data: Match[];
}

/**
 * 축구 경기 데이터를 가져오는 커스텀 훅
 */
export default function useSoccersAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 경기 목록을 가져오는 함수
   */
  const getMatches = useCallback(async (): Promise<Match[] | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // API 엔드포인트 URL (실제 환경에 맞게 수정 필요)
      const apiUrl = '/api/soccer/matches';
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const result: SoccersAPIResponse = await response.json();
      
      if (!result.success) {
        throw new Error('API 응답 오류: 데이터를 가져오지 못했습니다.');
      }
      
      return result.data;
    } catch (err) {
      console.error('경기 데이터 가져오기 오류:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getMatches,
    loading,
    error
  };
} 