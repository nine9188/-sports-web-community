'use client';

import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { SocialPlatform } from './utils/detectPlatform';
import { extractId } from './utils/extractId';
import { TwitterEmbed } from './platforms/twitter';
import { InstagramEmbed } from './platforms/instagram';
import { TikTokEmbed } from './platforms/tiktok';
import { YouTubeEmbed } from './platforms/youtube';
import { FacebookEmbed } from './platforms/facebook';
import { LinkedInEmbed } from './platforms/linkedin';

interface SocialEmbedComponentProps {
  node: NodeViewProps['node'];
}

export const SocialEmbedComponent: React.FC<SocialEmbedComponentProps> = ({ node }) => {
  const platform = node.attrs.platform as SocialPlatform;
  const url = node.attrs.url as string;

  if (!platform || !url) {
    return (
      <NodeViewWrapper className="social-embed-error">
        <div className="p-4 border rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          잘못된 소셜 미디어 URL입니다.
        </div>
      </NodeViewWrapper>
    );
  }

  const id = extractId(url, platform);

  if (!id && platform !== 'facebook' && platform !== 'linkedin') {
    return (
      <NodeViewWrapper className="social-embed-error">
        <div className="p-4 border rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          URL에서 ID를 추출할 수 없습니다: {url}
        </div>
      </NodeViewWrapper>
    );
  }

  const renderEmbed = () => {
    switch (platform) {
      case 'twitter':
        return <TwitterEmbed tweetId={id!} />;
      case 'instagram':
        return <InstagramEmbed postId={id!} />;
      case 'tiktok':
        return <TikTokEmbed videoId={id!} />;
      case 'youtube':
        return <YouTubeEmbed videoId={id!} />;
      case 'facebook':
        return <FacebookEmbed url={url} />;
      case 'linkedin':
        return <LinkedInEmbed url={url} />;
      default:
        return (
          <div className="p-4 border rounded bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
            지원하지 않는 플랫폼입니다: {platform}
          </div>
        );
    }
  };

  return (
    <NodeViewWrapper className={`social-embed ${platform}-embed`}>
      {renderEmbed()}
    </NodeViewWrapper>
  );
};
