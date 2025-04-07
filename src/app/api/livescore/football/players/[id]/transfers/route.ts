import { NextResponse } from 'next/server';

// 인터페이스 정의
interface TransferTeam {
  id?: number;
  name?: string;
  logo?: string;
}

interface Transfer {
  date?: string;
  type?: string;
  teams?: {
    out?: TransferTeam;
    in?: TransferTeam;
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // API-Football에서 이적 데이터 가져오기
    const transfersResponse = await fetch(
      `https://v3.football.api-sports.io/transfers?player=${id}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    if (!transfersResponse.ok) {
      throw new Error('Failed to fetch transfers data');
    }

    const transfersData = await transfersResponse.json();

    // API 응답이 없거나 비어있는 경우
    if (!transfersData.response || transfersData.response.length === 0) {
      return NextResponse.json([]);
    }

    // 응답 데이터 포맷팅 - transfers 배열에서 데이터 추출
    const formattedTransfers = transfersData.response[0].transfers.map((transfer: Transfer) => ({
      date: transfer.date || '',
      type: transfer.type || '',
      teams: {
        from: {
          id: transfer.teams?.out?.id || 0,
          name: transfer.teams?.out?.name || '',
          logo: transfer.teams?.out?.logo || '',
        },
        to: {
          id: transfer.teams?.in?.id || 0,
          name: transfer.teams?.in?.name || '',
          logo: transfer.teams?.in?.logo || '',
        }
      }
    }));

    // 데이터 검증
    if (!Array.isArray(formattedTransfers)) {
      return NextResponse.json([]);
    }

    return NextResponse.json(formattedTransfers);

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch transfers data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
