import type { Metadata } from 'next';
import { notFoundBody, notFoundStyles } from '@/shared/not-found/notFoundMarkup';

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다',
  description: '요청하신 페이지가 존재하지 않습니다.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <>
      <style>{`
        ${notFoundStyles}

        [data-site-shell]:has([data-global-not-found]) > [data-site-header],
        [data-site-shell]:has([data-global-not-found]) [data-site-left-sidebar],
        [data-site-shell]:has([data-global-not-found]) [data-site-right-sidebar],
        [data-site-shell]:has([data-global-not-found]) > [data-site-footer],
        [data-site-shell]:has([data-global-not-found]) > [data-site-chatbot] {
          display: none !important;
        }

        [data-site-shell]:has([data-global-not-found]) [data-site-content-row] {
          display: block !important;
          max-width: none !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
          width: 100% !important;
        }

        [data-site-shell]:has([data-global-not-found]) [data-site-main] {
          margin: 0 !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          width: 100% !important;
        }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: notFoundBody }} />
    </>
  );
}
