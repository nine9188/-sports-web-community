import { Short } from './types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 실제 API 사용 시 구현할 함수
export async function fetchShorts(): Promise<Short[]> {
  // 실제 유튜브 쇼츠 데이터 사용
  return [
    {
      id: '1',
      title: '스포츠 쇼츠 하이라이트',
      description: '놀라운 스포츠 장면들을 확인하세요!',
      videoUrl: '',
      youtubeId: 'v48z5Vikw6c',
      likes: 1200,
      views: 5000,
      author: '스포츠하이라이트',
      authorAvatar: 'https://i.pravatar.cc/150?img=1',
      isYouTube: true,
      uploadDate: '2023-05-15',
      category: '스포츠',
      thumbnail: 'https://img.youtube.com/vi/v48z5Vikw6c/mqdefault.jpg'
    },
    {
      id: '2',
      title: '골프 스윙 하이라이트',
      description: '최고의 골프 스윙 모먼트!',
      videoUrl: '',
      youtubeId: 'aLShfAwpjRU',
      likes: 890,
      views: 3500,
      author: '골프매니아',
      authorAvatar: 'https://i.pravatar.cc/150?img=2',
      isYouTube: true,
      uploadDate: '2023-06-20',
      category: '골프',
      thumbnail: 'https://img.youtube.com/vi/aLShfAwpjRU/mqdefault.jpg'
    },
    {
      id: '3',
      title: '축구 경기 하이라이트',
      description: '최고의 축구 순간들!',
      videoUrl: '',
      youtubeId: 'eRiuUMn5JOM',
      likes: 2300,
      views: 8900,
      author: '스포츠모먼트',
      authorAvatar: 'https://i.pravatar.cc/150?img=3',
      isYouTube: true,
      uploadDate: '2023-07-05',
      category: '축구',
      thumbnail: 'https://img.youtube.com/vi/eRiuUMn5JOM/mqdefault.jpg'
    },
    {
      id: '4',
      title: '농구 슬램덩크 하이라이트',
      description: '농구 코트의 놀라운 순간들...',
      videoUrl: '',
      youtubeId: 'o410MN1VmTg',
      likes: 5600,
      views: 25000,
      author: '농구맨',
      authorAvatar: 'https://i.pravatar.cc/150?img=4',
      isYouTube: true,
      uploadDate: '2023-08-10',
      category: '농구',
      thumbnail: 'https://img.youtube.com/vi/o410MN1VmTg/mqdefault.jpg'
    },
    {
      id: '5',
      title: '테니스 경기 하이라이트',
      description: '테니스 코트의 최고의 순간들',
      videoUrl: '',
      youtubeId: 'TJ_MpV398GM',
      likes: 8900,
      views: 45000,
      author: '테니스스타',
      authorAvatar: 'https://i.pravatar.cc/150?img=5',
      isYouTube: true,
      uploadDate: '2023-09-15',
      category: '테니스',
      thumbnail: 'https://img.youtube.com/vi/TJ_MpV398GM/mqdefault.jpg'
    },
  ];
}

// 특정 쇼츠 가져오기
export async function fetchShortById(id: string): Promise<Short | null> {
  const shorts = await fetchShorts();
  return shorts.find(short => short.id === id) || null;
} 