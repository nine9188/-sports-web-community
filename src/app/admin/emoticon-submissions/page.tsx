import SubmissionManagement from './components/SubmissionManagement'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '이모티콘 신청 관리 | 관리자',
}

// 관리자 인증은 layout.tsx에서 처리됨
export default async function EmoticonSubmissionsPage() {
  return <SubmissionManagement />
}
