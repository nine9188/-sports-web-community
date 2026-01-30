'use client';

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry에 에러 전송
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center',
            maxWidth: '400px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#111827'
            }}>
              심각한 오류가 발생했습니다
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '24px'
            }}>
              페이지를 불러오는 중 문제가 발생했습니다.
            </p>
            {error.digest && (
              <p style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '16px'
              }}>
                오류 코드: {error.digest}
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  backgroundColor: '#1f2937',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                다시 시도
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/"
                style={{
                  border: '1px solid #d1d5db',
                  color: '#374151',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  textDecoration: 'none'
                }}
              >
                메인페이지
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
