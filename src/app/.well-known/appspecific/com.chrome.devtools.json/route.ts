import { NextResponse } from 'next/server';

export async function GET() {
  // Chrome DevTools 요청에 대해 빈 응답 반환
  return NextResponse.json({}, { status: 200 });
} 