'use client';

import React from 'react';

interface TikTokEmbedProps {
  videoId: string;
}

export const TikTokEmbed: React.FC<TikTokEmbedProps> = ({ videoId }) => {
  return (
    <div className="tiktok-embed my-4 flex justify-center">
      <blockquote
        className="tiktok-embed"
        cite={`https://www.tiktok.com/@placeholder/video/${videoId}`}
        data-video-id={videoId}
        style={{ maxWidth: '605px', minWidth: '325px' }}
      >
        <section>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`https://www.tiktok.com/@placeholder/video/${videoId}`}
          >
            TikTok 보기
          </a>
        </section>
      </blockquote>
      <script async src="https://www.tiktok.com/embed.js"></script>
    </div>
  );
};
