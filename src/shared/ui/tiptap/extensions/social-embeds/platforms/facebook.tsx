'use client';

import React, { useEffect, useState } from 'react';
import { loadScript } from '../utils/loadScript';

const FACEBOOK_SDK = 'https://connect.facebook.net/ko_KR/sdk.js#xfbml=1&version=v18.0';

interface FacebookEmbedProps {
  url: string;
}

export const FacebookEmbed: React.FC<FacebookEmbedProps> = ({ url }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadScript(FACEBOOK_SDK, 'facebook-jssdk')
      .then(() => {
        setLoaded(true);
        // Facebook SDK 파싱
        if (window.FB?.XFBML) {
          window.FB.XFBML.parse();
        }
      })
      .catch((err) => {
        console.error('Facebook SDK loading failed:', err);
        setError(true);
      });
  }, [url]);

  if (error) {
    return (
      <div className="p-4 border rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
        페이스북 게시물을 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className="facebook-embed my-4 flex justify-center">
      <div
        className="fb-post"
        data-href={url}
        data-width="500"
        data-show-text="true"
      >
        <blockquote cite={url} className="fb-xfbml-parse-ignore">
          <a href={url}>게시물 보기</a>
        </blockquote>
      </div>
      {!loaded && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          페이스북 게시물을 불러오는 중...
        </div>
      )}
    </div>
  );
};
