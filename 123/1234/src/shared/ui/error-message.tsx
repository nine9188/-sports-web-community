import React from 'react';
import Link from 'next/link';

interface ErrorMessageProps {
  title?: string;
  message: string;
  backLink?: string;
  backText?: string;
}

export default function ErrorMessage({
  title = '오류가 발생했습니다',
  message,
  backLink = '/boards',
  backText = '게시판 목록으로 이동'
}: ErrorMessageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg border shadow-md p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <Link href={backLink} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          {backText}
        </Link>
      </div>
    </div>
  );
} 