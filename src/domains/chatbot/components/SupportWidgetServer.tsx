import SupportWidget from './SupportWidget'
import { getChatSessionsOverviewQuery } from '@/domains/chatbot/queries'

export default async function SupportWidgetServer() {
  const initialDbSessions = await getChatSessionsOverviewQuery()
  return <SupportWidget initialDbSessions={initialDbSessions} />
}


