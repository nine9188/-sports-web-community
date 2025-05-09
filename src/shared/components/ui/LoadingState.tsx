'use client';

import React from 'react';
import styles from './LoadingState.module.css';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingState = ({
  message = '로딩 중...',
  fullScreen = false,
  size = 'medium',
}: LoadingStateProps) => {
  const sizeClassName = {
    small: styles.spinnerSmall,
    medium: styles.spinnerMedium,
    large: styles.spinnerLarge,
  }[size];

  const fontSizeClassName = {
    small: styles.textSmall,
    medium: styles.textMedium,
    large: styles.textLarge,
  }[size];
  
  return (
    <div className={`${styles.loadingContainer} ${fullScreen ? styles.fullScreen : ''}`}>
      <div className={styles.spinnerWrapper}>
        <div className={`${styles.spinner} ${sizeClassName}`} />
      </div>
      {message && <p className={`${styles.loadingMessage} ${fontSizeClassName}`}>{message}</p>}
    </div>
  );
};

export default LoadingState; 