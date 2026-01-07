import { Metadata } from 'next';
import AdminLayoutClient from './components/AdminLayoutClient';

export const metadata: Metadata = {
  title: '관리자 - 4590 Football',
  description: '4590 Football 관리자 페이지',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
} 