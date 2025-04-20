import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { fetchShorts } from '@/app/(shorts)/service';
import { Short } from '@/app/(shorts)/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'SPORTS 쇼츠 | 짧은 스포츠 동영상',
  description: '모든 게이머들을 위한 SPORTS 쇼츠 콘텐츠를 확인하세요',
};

export default async function ShortsPage() {
  // 서버 사이드에서 데이터 가져오기
  const shorts = await fetchShorts();

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-120px)]">
      <div className="max-w-4xl w-full py-6 px-4">
        <h2 className="text-2xl font-bold text-left mb-2">SPORTS 쇼츠</h2>
        <p className="text-gray-600 mb-8 text-left">
          모든 게이머들을 위한 SPORTS 쇼츠 콘텐츠를 확인하세요.
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {shorts.map((short: Short) => (
            <Link 
              key={short.id} 
              href={`/shorts/${short.id}`}
              className="block aspect-[9/16] max-w-[200px] mx-auto bg-gray-100 rounded-lg overflow-hidden relative hover:scale-105 transition-transform shadow-md"
            >
              {/* 배경 이미지 */}
              <div className="w-full h-full bg-cover bg-center" 
                style={{ 
                  backgroundImage: short.thumbnail 
                    ? `url(${short.thumbnail})` 
                    : (short.isYouTube && short.youtubeId 
                        ? `url(https://img.youtube.com/vi/${short.youtubeId}/mqdefault.jpg)` 
                        : 'none'),
                  backgroundColor: 'rgb(245, 245, 245)'
                }}>
              </div>
              
              {/* 오버레이 그라데이션 */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70"></div>
              
              {/* 재생 버튼 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="40" 
                  height="40" 
                  viewBox="0 0 24 24" 
                  fill="white" 
                  className="opacity-70"
                >
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </div>
              
              {/* 비디오 정보 */}
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <h3 className="text-sm font-medium line-clamp-2 text-white">{short.title}</h3>
                <div className="flex items-center mt-1">
                  <Image 
                    src={short.authorAvatar || '/placeholder-avatar.png'} 
                    alt={short.author || '작성자'} 
                    width={20}
                    height={20}
                    className="rounded-full mr-1"
                  />
                  <span className="text-xs text-gray-300">{short.author}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {short.views?.toLocaleString() || short.viewCount?.toLocaleString()} 조회
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="mt-8 flex space-x-4 text-sm text-gray-500">
        <Link href="/terms" className="hover:text-gray-700">이용약관</Link>
        <Link href="/privacy" className="hover:text-gray-700">개인정보처리방침</Link>
      </div>
    </div>
  );
} 