'use client';

import React from 'react';

interface FacebookEmbedProps {
  url: string;
}

export const FacebookEmbed: React.FC<FacebookEmbedProps> = ({ url }) => {
  const encodedUrl = encodeURIComponent(url);

  return (
    <div className="facebook-embed my-4 flex justify-center">
      <iframe
        src={`https://www.facebook.com/plugins/post.php?href=${encodedUrl}&show_text=true&width=500`}
        width="500"
        height="600"
        style={{ border: 'none', overflow: 'hidden' }}
        scrolling="no"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      />
    </div>
  );
};
