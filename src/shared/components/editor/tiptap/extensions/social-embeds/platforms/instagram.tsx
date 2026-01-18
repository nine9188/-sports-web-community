'use client';

import React, { useEffect, useState } from 'react';
import { loadScript } from '../utils/loadScript';

const INSTAGRAM_SCRIPT = 'https://www.instagram.com/embed.js';

interface InstagramEmbedProps {
  postId: string;
}

export const InstagramEmbed: React.FC<InstagramEmbedProps> = ({ postId }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadScript(INSTAGRAM_SCRIPT, 'instagram-embed-js')
      .then(() => {
        setLoaded(true);
        // Instagram 임베드 처리
        if (window.instgrm?.Embeds) {
          window.instgrm.Embeds.process();
        }
      })
      .catch((err) => {
        console.error('Instagram script loading failed:', err);
        setError(true);
      });
  }, [postId]);

  if (error) {
    return (
      <div className="p-4 border rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
        인스타그램 게시물을 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className="instagram-embed my-4 flex justify-center">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={`https://www.instagram.com/p/${postId}/`}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: '0',
          borderRadius: '3px',
          boxShadow: '0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)',
          margin: '1px',
          maxWidth: '540px',
          minWidth: '326px',
          padding: '0',
          width: '99.375%',
        }}
      >
        <div style={{ padding: '16px' }}>
          <a
            href={`https://www.instagram.com/p/${postId}/`}
            style={{
              background: '#FFFFFF',
              lineHeight: '0',
              padding: '0 0',
              textAlign: 'center',
              textDecoration: 'none',
              width: '100%',
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram 게시물 보기
          </a>
        </div>
      </blockquote>
      {!loaded && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          인스타그램 게시물을 불러오는 중...
        </div>
      )}
    </div>
  );
};
