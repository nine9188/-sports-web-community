'use client';

import { useState } from 'react';

export default function TestCronPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testCron = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/cron/check-hot-posts', {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(`Error ${response.status}: ${JSON.stringify(data)}`);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔥 HOT 게시글 Cron 테스트</h1>

        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">수동 실행</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Cron API를 수동으로 호출하여 HOT 게시글 알림을 테스트합니다.
          </p>

          <button
            onClick={testCron}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? '실행 중...' : '🚀 Cron 실행'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">
              ❌ 에러 발생
            </h3>
            <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
              {error}
            </pre>
          </div>
        )}

        {result && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="text-green-800 dark:text-green-200 font-semibold mb-2">
              ✅ 실행 성공
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>총 HOT 게시글:</strong> {result.totalHotPosts}개
              </p>
              <p>
                <strong>발송된 알림:</strong> {result.notificationsSent}개
              </p>
              <p>
                <strong>실패한 알림:</strong> {result.notificationsFailed}개
              </p>
              {result.topPosts && result.topPosts.length > 0 && (
                <div className="mt-4">
                  <strong className="block mb-2">상위 5개 게시글:</strong>
                  <ul className="space-y-1 pl-4">
                    {result.topPosts.map((post: any, idx: number) => (
                      <li key={idx} className="text-gray-700 dark:text-gray-300">
                        #{post.rank} - {post.title} (점수: {post.score})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                  전체 응답 보기
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
            📋 참고사항
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Vercel Cron은 매시간 정각(0분)에 자동 실행됩니다</li>
            <li>최근 7일 내 게시글 중 상위 100개를 분석합니다</li>
            <li>HOT 점수 = (조회수 × 1 + 좋아요 × 10 + 댓글 × 20) × 시간감쇠</li>
            <li>상위 10위 이내 게시글 작성자에게 알림이 발송됩니다</li>
            <li>동일 게시글은 24시간 내 중복 알림이 발송되지 않습니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
