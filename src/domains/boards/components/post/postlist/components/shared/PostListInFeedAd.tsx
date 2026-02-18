'use client';

import AdSense from '@/shared/components/AdSense';

const AD_SLOT = '7975162394';
const AD_LAYOUT_KEY = '-it-8+2c-1x-39';

/** 게시글 목록 사이에 삽입되는 인피드 광고 (2번째 게시글 뒤) */
export const POST_LIST_AD_INDEX = 2;

/** 테이블(text variant) 용 인피드 광고 행 */
export function PostListInFeedAdRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <AdSense
          adSlot={AD_SLOT}
          adFormat="fluid"
          adLayoutKey={AD_LAYOUT_KEY}
          style={{ display: 'block' }}
        />
      </td>
    </tr>
  );
}

/** 카드/모바일(div) 용 인피드 광고 */
export function PostListInFeedAd() {
  return (
    <div className="border-b border-black/5 dark:border-white/10">
      <AdSense
        adSlot={AD_SLOT}
        adFormat="fluid"
        adLayoutKey={AD_LAYOUT_KEY}
        style={{ display: 'block' }}
      />
    </div>
  );
}
