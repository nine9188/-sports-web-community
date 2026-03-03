/** 매치 하이라이트 DB 레코드 */
export interface MatchHighlight {
  id: string;
  fixture_id: number;
  league_id: number;
  video_id: string;
  video_title: string | null;
  channel_name: string | null;
  source_type: 'korean' | 'official' | 'search';
  thumbnail_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** YouTube playlistItems.list API 응답 아이템 */
export interface YouTubePlaylistItem {
  snippet: {
    publishedAt: string;
    title: string;
    description: string;
    thumbnails: {
      default: YouTubeThumbnail;
      medium: YouTubeThumbnail;
      high: YouTubeThumbnail;
      standard?: YouTubeThumbnail;
      maxres?: YouTubeThumbnail;
    };
    channelTitle: string;
    resourceId: {
      kind: string;
      videoId: string;
    };
  };
}

interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

/** YouTube API 응답 */
export interface YouTubePlaylistResponse {
  items: YouTubePlaylistItem[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

/** 하이라이트 매칭 결과 */
export interface HighlightMatchResult {
  videoId: string;
  videoTitle: string;
  channelName: string;
  thumbnailUrl: string;
  publishedAt: string;
  sourceType: 'korean' | 'official' | 'search';
}
