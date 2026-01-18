'use client';

import React, { useEffect, useState } from 'react';
import { loadScript } from '../utils/loadScript';

const TWITTER_SCRIPT = 'https://platform.twitter.com/widgets.js';

interface TwitterEmbedProps {
  tweetId: string;
}

export const TwitterEmbed: React.FC<TwitterEmbedProps> = ({ tweetId }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadScript(TWITTER_SCRIPT, 'twitter-widget-js')
      .then(() => {
        setLoaded(true);
        // 트위터 위젯 렌더링
        if (window.twttr?.widgets) {
          window.twttr.widgets.load();
        }
      })
      .catch((err) => {
        console.error('Twitter script loading failed:', err);
        setError(true);
      });
  }, [tweetId]);

  if (error) {
    return (
      <div className="p-4 border rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
        트윗을 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className="twitter-embed my-4">
      <blockquote className="twitter-tweet" data-conversation="none" data-theme="light">
        <a href={`https://twitter.com/i/status/${tweetId}`}>Loading Tweet...</a>
      </blockquote>
      {!loaded && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          트윗을 불러오는 중...
        </div>
      )}
    </div>
  );
};
