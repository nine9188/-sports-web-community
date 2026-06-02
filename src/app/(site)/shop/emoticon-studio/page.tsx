import { buildMetadata } from '@/shared/utils/metadataNew'
import EmoticonStudioClient from './EmoticonStudioClient'

export async function generateMetadata() {
  return buildMetadata({
    title: '이모티콘 스튜디오',
    description: '나만의 이모티콘 팩을 만들어 등록 신청하세요.',
    path: '/shop/emoticon-studio',
    robots: { index: false, follow: true },
  })
}

export default function EmoticonStudioPage() {
  return <EmoticonStudioClient />
}
