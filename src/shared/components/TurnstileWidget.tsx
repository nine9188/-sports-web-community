'use client';

import React, { useEffect, useRef, useState } from 'react';

declare global {
	interface Window {
		turnstile?: {
			render: (
				element: HTMLElement,
				options: {
					sitekey: string;
					theme?: 'light' | 'dark' | 'auto';
					size?: 'normal' | 'flexible' | 'invisible' | 'compact';
					callback?: (token: string) => void;
					'error-callback'?: () => void;
					'expired-callback'?: () => void;
				}
			) => void;
			reset?: (id?: string) => void;
		};
	}
}

type Props = {
	siteKey: string;
	onToken: (token: string | null) => void;
	className?: string;
	appearance?: 'light' | 'dark' | 'auto';
};

export default function TurnstileWidget({ siteKey, onToken, className, appearance = 'auto' }: Props) {
    const elRef = useRef<HTMLDivElement | null>(null);
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const hintTimerRef = useRef<number | null>(null);

    useEffect(() => {
		let mounted = true;

        function render() {
			if (!mounted || !elRef.current || !window.turnstile) return;
            // 이미 렌더링된 경우 재렌더 방지 (StrictMode/재실행 대비)
            if (elRef.current.childElementCount > 0) return;
			try {
                window.turnstile.render(elRef.current, {
					sitekey: siteKey,
					theme: appearance,
					size: 'flexible',
                    callback: (token: string) => { setHasError(false); setIsLoaded(true); if (hintTimerRef.current) { clearTimeout(hintTimerRef.current); hintTimerRef.current = null; setShowHint(false); } onToken(token); },
                    'error-callback': () => { setHasError(true); setIsLoaded(true); if (hintTimerRef.current) { clearTimeout(hintTimerRef.current); hintTimerRef.current = null; } onToken(null); },
                    'expired-callback': () => { setHasError(false); setIsLoaded(true); if (hintTimerRef.current) { clearTimeout(hintTimerRef.current); hintTimerRef.current = null; } onToken(null); },
				});
                setIsLoaded(true);
                if (hintTimerRef.current) { clearTimeout(hintTimerRef.current); hintTimerRef.current = null; setShowHint(false); }
			} catch {
                setHasError(true);
			}
		}

		function ensureScript() {
			const id = 'cf-turnstile-script';
			const existingScript = document.getElementById(id);

			if (existingScript) {
				// 스크립트가 이미 있지만 turnstile이 아직 로드 안됐을 수 있음
				if (window.turnstile) {
					render();
				} else {
					// turnstile 로드 대기
					const checkInterval = setInterval(() => {
						if (!mounted) {
							clearInterval(checkInterval);
							return;
						}
						if (window.turnstile) {
							clearInterval(checkInterval);
							render();
						}
					}, 50);
					// 5초 후 타임아웃
					setTimeout(() => clearInterval(checkInterval), 5000);
				}
				return;
			}

			const s = document.createElement('script');
			s.id = id;
            s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
			s.async = true;
			s.defer = true;
			s.onload = render;
			document.head.appendChild(s);
		}

		ensureScript();
        // 지연된 로딩 힌트 (빠르게 로드되면 표시 안 함)
        hintTimerRef.current = window.setTimeout(() => setShowHint(true), 600);
		return () => {
			mounted = false;
            if (hintTimerRef.current) {
                clearTimeout(hintTimerRef.current);
                hintTimerRef.current = null;
            }
		};
    }, [siteKey, appearance, onToken]);

    if (!siteKey) {
        return (
            <div className={className}>
                <div className="min-h-[64px] w-full rounded border border-red-300 bg-red-50 text-red-700 text-xs flex items-center px-3">
                    Turnstile 키가 설정되지 않았습니다. 환경변수 NEXT_PUBLIC_TURNSTILE_SITE_KEY를 설정하세요.
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            <div ref={elRef} className="min-h-[64px] w-full" />
            {!isLoaded && showHint && (
                <div className="mt-2 text-xs text-gray-500">불러오는 중…</div>
            )}
            {hasError && (
                <div className="mt-2 text-xs text-red-600">보안 위젯 로딩에 실패했습니다. 새로고침 후 다시 시도하세요.</div>
            )}
        </div>
    );
}


