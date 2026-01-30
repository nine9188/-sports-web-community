'use client';

import { useEffect } from 'react';
import {
  errorContainerStyles,
  errorCardStyles,
  errorIconStyles,
  errorTitleStyles,
  errorDescriptionStyles,
  errorDigestStyles,
  errorButtonContainerStyles,
  errorPrimaryButtonStyles,
  errorSecondaryButtonStyles,
  domainErrorConfig
} from '@/shared/styles/error';

const config = domainErrorConfig.shop;

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Shop] Error:', error);
  }, [error]);

  return (
    <div className={errorContainerStyles}>
      <div className={errorCardStyles}>
        <div className={errorIconStyles}>{config.icon}</div>
        <h1 className={errorTitleStyles}>{config.title}</h1>
        <p className={errorDescriptionStyles}>{config.description}</p>
        {error.digest && (
          <p className={errorDigestStyles}>
            오류 코드: {error.digest}
          </p>
        )}
        <div className={errorButtonContainerStyles}>
          <button onClick={reset} className={errorPrimaryButtonStyles}>
            다시 시도
          </button>
          <a href={config.backUrl} className={errorSecondaryButtonStyles}>
            {config.backLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
