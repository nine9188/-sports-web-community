// API 호출을 위한 유틸리티 함수들
// 현재 직접 사용되지 않지만 향후 확장을 위해 보존
// const API_BASE_URL = 'https://v3.football.api-sports.io';
// const API_KEY = process.env.FOOTBALL_API_KEY || '';

// const headers = {
//   'x-rapidapi-host': 'v3.football.api-sports.io',
//   'x-rapidapi-key': API_KEY,
// };

export async function getTeamData(teamId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/livescore/football/teams/${teamId}`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch team data');
  }
  
  return response.json();
}

export async function getTeamMatches(teamId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/livescore/football/teams/${teamId}/matches`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch matches data');
  }
  
  return response.json();
}

export async function getTeamStandings(teamId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/livescore/football/teams/${teamId}/standings`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch standings data');
  }
  
  const data = await response.json();
  
  // 데이터 구조 확인 및 변환
  // API 응답이 배열의 배열 형태인 경우 첫 번째 배열만 사용
  if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
    return data[0];
  }
  
  // 이미 적절한 형태인 경우
  if (Array.isArray(data)) {
    return data;
  }
  
  // data.data가 있는 경우
  if (data && data.data && Array.isArray(data.data)) {
    return data.data;
  }
  
  // 기본 빈 배열 반환
  return [];
}

export async function getTeamSquad(teamId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/livescore/football/teams/${teamId}/squad`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch squad data');
  }
  
  return response.json();
}

export async function getTeamCoach(teamId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/livescore/football/teams/${teamId}/coach`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch coach data');
  }
  
  return response.json();
} 