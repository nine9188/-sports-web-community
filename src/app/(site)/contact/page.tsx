import { Metadata } from 'next';
import Image from 'next/image';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { siteConfig } from '@/shared/config';
import { Mail, Handshake, Megaphone, HelpCircle } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: '제휴/광고 문의',
    description: '4590 Football 제휴, 광고, 기타 문의를 위한 연락처 안내 페이지입니다.',
    path: '/contact',
  });
}

const contactCategories = [
  {
    icon: Handshake,
    title: '제휴 문의',
    description: '데이터 제휴, API 연동, 콘텐츠 파트너십 등 다양한 형태의 제휴를 환영합니다.',
    email: 'support@4590football.com',
    subject: '[제휴] ',
  },
  {
    icon: Megaphone,
    title: '광고 문의',
    description: '배너 광고, 스폰서십, 브랜드 캠페인 등 광고 집행에 대해 안내해 드립니다.',
    email: 'support@4590football.com',
    subject: '[광고] ',
  },
  {
    icon: HelpCircle,
    title: '기타 문의',
    description: '서비스 이용 관련 문의, 건의사항, 버그 리포트 등 기타 문의를 받습니다.',
    email: 'support@4590football.com',
    subject: '[문의] ',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1D1D1D]">
      {/* 왼쪽 상단 로고 */}
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <a href="/" className="inline-block">
          <Image src={siteConfig.logo} alt="4590 Football" width={124} height={60} className="h-10 sm:h-14 w-auto dark:invert" />
        </a>
      </div>

      {/* 헤더 */}
      <section className="border-b border-black/7 dark:border-white/10 bg-[#F9FAFB] dark:bg-[#262626]">
        <div className="container mx-auto px-4 py-14 md:py-20 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-[#F0F0F0] mb-3">
            문의하기
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            제휴, 광고, 기타 문의사항이 있으시면 아래 이메일로 연락해 주세요.<br />
            빠른 시일 내에 답변 드리겠습니다.
          </p>
        </div>
      </section>

      {/* 대표 이메일 */}
      <section className="container mx-auto px-4 py-10">
        <div className="max-w-xl mx-auto text-center p-6 rounded-xl border border-black/7 dark:border-white/10 bg-[#F9FAFB] dark:bg-[#262626]">
          <Mail className="w-8 h-8 text-gray-900 dark:text-[#F0F0F0] mx-auto mb-3" />
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-1">대표 이메일</p>
          <a
            href="mailto:support@4590football.com"
            className="text-xl font-semibold text-gray-900 dark:text-[#F0F0F0] hover:underline"
          >
            support@4590football.com
          </a>
        </div>
      </section>

      {/* 문의 카테고리 */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {contactCategories.map((category) => (
            <a
              key={category.title}
              href={`mailto:${category.email}?subject=${encodeURIComponent(category.subject)}`}
              className="group p-5 rounded-xl border border-black/7 dark:border-white/10 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-900 dark:bg-[#F0F0F0] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <category.icon className="w-4 h-4 text-white dark:text-gray-900" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-[#F0F0F0] mb-1">
                {category.title}
              </h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                {category.description}
              </p>
            </a>
          ))}
        </div>

        {/* 안내 */}
        <div className="max-w-3xl mx-auto mt-8 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            이메일 제목에 [제휴], [광고], [문의] 등을 붙여주시면 더 빠른 답변이 가능합니다.
          </p>
        </div>
      </section>

    </div>
  );
}
