import { fetchShortById, fetchShorts } from '@/app/(shorts)/service';
import { notFound } from 'next/navigation';
import ShortsViewer from '@/app/(shorts)/ShortsViewer';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

// 페이지 속성 타입 정의
interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const { id } = await params;
    
    const short = await fetchShortById(id);
    
    if (!short) return { title: '존재하지 않는 쇼츠' };
    
    return {
      title: `${short.title} | 스포츠 쇼츠`,
      description: short.description,
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: '스포츠 쇼츠',
      description: '스포츠 쇼츠 페이지',
    };
  }
}

export default async function ShortPage({ params }: PageProps) {
  try {
    const { id } = await params;
    
    // ID가 없는 경우 404 페이지로 리다이렉트
    if (!id) {
      return notFound();
    }
    
    const short = await fetchShortById(id);
    if (!short) {
      return notFound();
    }

    // 모든 쇼츠 데이터 가져오기
    const shorts = await fetchShorts();
    
    return (
      <div className="h-screen bg-white">
        <ShortsViewer currentShortId={id} shorts={shorts} />
      </div>
    );
  } catch (error) {
    console.error('Error loading short:', error);
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">쇼츠를 불러오는 중 오류가 발생했습니다</h1>
          <Link href="/shorts" className="px-4 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }
} 