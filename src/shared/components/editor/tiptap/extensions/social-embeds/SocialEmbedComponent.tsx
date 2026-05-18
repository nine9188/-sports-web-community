'use client';

import React from 'react';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { SocialPlatform } from './utils/detectPlatform';

interface SocialEmbedComponentProps {
  node: NodeViewProps['node'];
}

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  twitter: 'X',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
};

export const SocialEmbedComponent: React.FC<SocialEmbedComponentProps> = ({ node }) => {
  const platform = node.attrs.platform as SocialPlatform;
  const url = node.attrs.url as string;

  if (!platform || !url) {
    return (
      <NodeViewWrapper className="social-embed social-embed-editor-card social-embed-error">
        <div className="social-embed-editor-card__label">소셜</div>
        <div className="social-embed-editor-card__url">지원하지 않는 링크입니다.</div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      className={`social-embed social-embed-editor-card ${platform}-embed`}
      data-platform={platform}
      data-url={url}
    >
      <div className="social-embed-editor-card__label">{PLATFORM_LABELS[platform] ?? 'Social'}</div>
      <div className="social-embed-editor-card__url">{url}</div>
    </NodeViewWrapper>
  );
};
