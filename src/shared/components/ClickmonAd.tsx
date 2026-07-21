'use client';

import { useState } from 'react';

interface ClickmonAdProps {
  adWidth: number;
  adHeight: number;
  className?: string;
  iframeUrl?: string;
  scriptUrl?: string;
}

const DEFAULT_PC_CLICKMON_URL =
  'https://tab2.clickmon.co.kr/pop/wp_ad_728.php?PopAd=CM_M_1003067%7C%5E%7CCM_A_1156826%7C%5E%7CAdver_M_1046207';

const DEFAULT_MOBILE_CLICKMON_URL =
  'https://mtab.clickmon.co.kr/pop/wp_m_320_100.php?PopAd=CM_M_1003067%7C%5E%7CCM_A_1156826%7C%5E%7CAdver_M_1046207&ifmcent=OK';

const DEFAULT_MOBILE_SLIM_CLICKMON_URL =
  'https://mtab.clickmon.co.kr/pop/wp_m_320.php?PopAd=CM_M_1003067%7C%5E%7CCM_A_1156826%7C%5E%7CAdver_M_1046207&ifmcent=OK';

const DEFAULT_SQUARE_CLICKMON_URL =
  'https://tab2.clickmon.co.kr/pop/wp_ad_300.php?PopAd=CM_M_1003067%7C%5E%7CCM_A_1156826%7C%5E%7CAdver_M_1046207';

export default function ClickmonAd({
  adWidth,
  adHeight,
  className,
  iframeUrl,
  scriptUrl,
}: ClickmonAdProps) {
  const [hasError, setHasError] = useState(false);

  let targetUrl = iframeUrl || scriptUrl;

  if (!targetUrl) {
    if (adHeight <= 60) {
      targetUrl = DEFAULT_MOBILE_SLIM_CLICKMON_URL;
    } else if (adHeight >= 150) {
      targetUrl = DEFAULT_SQUARE_CLICKMON_URL; // wp_ad_300.php 정사이즈 300x250 전용 클릭몬 배너
    } else if (adWidth >= 600) {
      targetUrl = DEFAULT_PC_CLICKMON_URL;
    } else {
      targetUrl = DEFAULT_MOBILE_CLICKMON_URL;
    }
  }

  if (hasError || !targetUrl) {
    return null;
  }

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-xl border border-black/5 dark:border-white/10 ${className || ''}`}
      style={{
        width: `${adWidth}px`,
        height: `${adHeight}px`,
        maxWidth: '100%',
      }}
    >
      <iframe
        src={targetUrl}
        width={adWidth}
        height={adHeight}
        frameBorder="0"
        scrolling="no"
        onError={() => setHasError(true)}
        className="border-0 overflow-hidden shrink-0"
        style={{
          width: `${adWidth}px`,
          height: `${adHeight}px`,
          maxWidth: '100%',
        }}
      />
    </div>
  );
}
