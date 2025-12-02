export interface Short {
  id: string;
  videoId?: string;
  title: string;
  description: string;
  videoUrl?: string;
  thumbnail?: string;
  category?: string;
  uploadDate?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  duration?: string;
  
  // 기존 필드 유지
  likes?: number;
  views?: number;
  author?: string;
  authorAvatar?: string;
  youtubeId?: string;
  isYouTube?: boolean;
}

export interface ShortsClientProps {
  shorts: Short[];
}

export interface YouTubePlayer {
  // 재생 제어 메서드
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  
  // 음량 제어 메서드
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  
  // 플레이어 상태 메서드
  getPlayerState: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  
  // 플레이어 관리 메서드
  destroy: () => void;
  
  // 이벤트 객체
  getIframe: () => HTMLIFrameElement;
  addEventListener: (event: string, listener: (event: YouTubeEvent) => void) => void;
}

export interface YouTubeEvent {
  target: YouTubePlayer;
  data: number;
} 