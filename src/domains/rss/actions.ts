'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// API 라우트용 Supabase 클라이언트 생성
function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface RSSItem {
  title: string
  description: string
  link: string
  pubDate: string
  author?: string
  imageUrl?: string
}

// RSS XML 파싱 함수
async function parseRSSFeed(url: string): Promise<RSSItem[]> {
  try {
    console.log(`🔍 RSS 파싱 시작: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS-Bot/1.0)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const xmlText = await response.text()
    console.log(`📄 XML 텍스트 길이: ${xmlText.length}자`)
    
    // 간단한 XML 파싱 (전체)
    const items: RSSItem[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi
    let match
    let itemCount = 0
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      itemCount++
      const itemXml = match[1]
      
      const title = extractXmlContent(itemXml, 'title')
      const description = extractXmlContent(itemXml, 'description')
      const link = extractXmlContent(itemXml, 'link')
      const pubDate = extractXmlContent(itemXml, 'pubDate')
      const author = extractXmlContent(itemXml, 'author')
      
      console.log(`📰 아이템 ${itemCount}: ${title} (${pubDate})`)
      console.log(`📝 설명: ${description.slice(0, 100)}...`)
      
      // 이미지 URL 추출 (RSS 설명 → 실제 기사 크롤링)
      let imageUrl = extractImageFromDescription(description) || 
                     extractXmlContent(itemXml, 'enclosure', 'url')
      
      // RSS에서 이미지를 찾지 못했으면 실제 기사 페이지 크롤링
      if (!imageUrl && link) {
        console.log(`🔍 RSS에서 이미지 없음, 기사 페이지 크롤링 시도...`)
        imageUrl = await fetchImageFromArticle(link)
      }
      
      if (title && link) {
        items.push({
          title: cleanHtml(title),
          description: cleanHtml(description),
          link,
          pubDate: pubDate || new Date().toISOString(),
          author,
          imageUrl
        })
      }
    }
    
    console.log(`✅ RSS 파싱 완료: 총 ${items.length}개 아이템 추출`)
    return items
  } catch (error) {
    console.error(`❌ RSS 파싱 오류 (${url}):`, error)
    throw error
  }
}

// XML 콘텐츠 추출 헬퍼 (CDATA 지원)
function extractXmlContent(xml: string, tag: string, attr?: string): string {
  if (attr) {
    const regex = new RegExp(`<${tag}[^>]*${attr}=["']([^"']*)["'][^>]*>`, 'i')
    const match = xml.match(regex)
    return match ? match[1] : ''
  }
  
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'is')
  const match = xml.match(regex)
  if (!match) return ''
  
  let content = match[1].trim()
  
  // CDATA 섹션 처리
  const cdataRegex = /<!\[CDATA\[([\s\S]*?)\]\]>/i
  const cdataMatch = content.match(cdataRegex)
  if (cdataMatch) {
    content = cdataMatch[1].trim()
  }
  
  return content
}

// HTML 태그 제거 및 엔티티 디코딩
function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .replace(/&quot;/g, '"') // HTML 엔티티 디코딩
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

// 설명에서 이미지 URL 추출 (개선된 버전)
// 실제 기사 페이지에서 이미지 크롤링
async function fetchImageFromArticle(articleUrl: string): Promise<string> {
  try {
    console.log(`🔍 기사 페이지 크롤링 시작: ${articleUrl}`)
    
    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      console.log(`❌ 페이지 로딩 실패: ${response.status}`)
      return ''
    }
    
    const html = await response.text()
    console.log(`📄 HTML 길이: ${html.length}자`)
    
    // 다양한 이미지 패턴 시도
    const imagePatterns = [
      // 풋볼리스트 특화 패턴
      /<img[^>]+class="[^"]*article[^"]*"[^>]+src=["']([^"']+)["'][^>]*>/i,
      /<img[^>]+src=["']([^"']+)["'][^>]*class="[^"]*article[^"]*"[^>]*>/i,
      
      // 일반적인 기사 이미지 패턴
      /<img[^>]+class="[^"]*content[^"]*"[^>]+src=["']([^"']+)["'][^>]*>/i,
      /<img[^>]+src=["']([^"']+)["'][^>]*class="[^"]*content[^"]*"[^>]*>/i,
      
      // og:image 메타 태그
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i,
      
      // 트위터 이미지
      /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      
      // 첫 번째 img 태그 (백업)
      /<img[^>]+src=["']([^"']+)["'][^>]*>/i
    ]
    
    for (const pattern of imagePatterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        let imageUrl = match[1]
        
        // 상대 경로를 절대 경로로 변환
        if (imageUrl.startsWith('/')) {
          const urlObj = new URL(articleUrl)
          imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`
        }
        
        // 유효한 이미지 URL인지 확인
        if (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || imageUrl.includes('image')) {
          console.log(`✅ 기사에서 이미지 발견: ${imageUrl}`)
          return imageUrl
        }
      }
    }
    
    console.log(`❌ 기사에서 이미지를 찾을 수 없음`)
    return ''
    
  } catch (error) {
    console.error(`❌ 기사 크롤링 오류: ${error}`)
    return ''
  }
}

function extractImageFromDescription(description: string): string {
  if (!description) return ''
  
  console.log(`🖼️ RSS 설명에서 이미지 추출 시도: ${description.slice(0, 100)}...`)
  
  // 1. img 태그에서 src 추출 (다양한 패턴)
  const imgPatterns = [
    /<img[^>]+src=["']([^"']+)["'][^>]*>/i,
    /<img[^>]*src=["']([^"']+)["'][^>]*>/i,
    /<img[^>]+src=([^\s>]+)[^>]*>/i
  ]
  
  for (const pattern of imgPatterns) {
    const match = description.match(pattern)
    if (match && match[1]) {
      console.log(`✅ RSS 설명에서 이미지 발견: ${match[1]}`)
      return match[1].replace(/['"]/g, '') // 따옴표 제거
    }
  }
  
  // 2. 일반 이미지 URL 패턴 찾기 (확장된 패턴)
  const urlPatterns = [
    /(https?:\/\/[^\s"'<>)]+\.(?:jpg|jpeg|png|gif|webp|JPG|JPEG|PNG|GIF|WEBP))/i,
    /(https?:\/\/cdn\.[^\s"'<>)]+)/i,
    /(https?:\/\/[^\s"'<>)]*\/[^\s"'<>)]*\.(?:jpg|jpeg|png|gif|webp))/i
  ]
  
  for (const pattern of urlPatterns) {
    const match = description.match(pattern)
    if (match && match[1]) {
      console.log(`✅ RSS 설명 URL 패턴에서 이미지 발견: ${match[1]}`)
      return match[1]
    }
  }
  
  console.log(`❌ RSS 설명에서 이미지를 찾을 수 없음`)
  return ''
}

// 로그 저장 함수
async function saveAutomationLog(
  triggerType: 'manual' | 'github_actions' | 'cron',
  status: 'success' | 'error' | 'partial',
  feedsProcessed: number,
  postsImported: number,
  errorMessage?: string,
  executionTimeMs?: number,
  details?: Record<string, unknown>
) {
  try {
    const supabase = createSupabaseClient()
    
    const { error } = await supabase
      .from('rss_automation_logs')
      .insert({
        trigger_type: triggerType,
        status,
        feeds_processed: feedsProcessed,
        posts_imported: postsImported,
        error_message: errorMessage,
        execution_time_ms: executionTimeMs,
        details: details ? JSON.stringify(details) : null
      })
    
    if (error) {
      console.error('❌ 로그 저장 실패:', error)
    } else {
      console.log('📝 자동화 로그 저장 완료')
    }
  } catch (error) {
    console.error('❌ 로그 저장 중 오류:', error)
  }
}

// 모든 활성 RSS 피드 가져오기
export async function fetchAllRSSFeeds(triggerType: 'manual' | 'github_actions' | 'cron' = 'manual') {
  const startTime = Date.now()
  console.log(`🔍 fetchAllRSSFeeds 시작 (트리거: ${triggerType})`)
  
  const supabase = createSupabaseClient()
  console.log('✅ Supabase 클라이언트 생성 완료')
  
  try {
    // 활성 RSS 피드 목록 조회
    console.log('📊 RSS 피드 조회 시작...')
    const { data: feeds, error: feedsError } = await supabase
      .from('rss_feeds')
      .select('*')
      .eq('is_active', true)
    
    console.log('📊 조회 결과:', { feeds, feedsError })
    
    if (feedsError) {
      console.error('❌ RSS 피드 조회 오류:', feedsError)
      throw feedsError
    }
    
    console.log(`📈 활성 RSS 피드 ${feeds?.length || 0}개 발견`)
    
    const results = []
    let totalPostsImported = 0
    
    for (const feed of feeds) {
      try {
        console.log(`RSS 피드 처리 중: ${feed.name || feed.url}`)
        
        // RSS 파싱
        const items = await parseRSSFeed(feed.url)
        
        // 새 게시글만 필터링 (최근 7일로 임시 확장)
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 7)
        
        console.log(`📅 필터링 기준 시간: ${yesterday.toISOString()}`)
        
        const newItems = items.filter(item => {
          const pubDate = new Date(item.pubDate)
          const isNew = pubDate > yesterday
          console.log(`📰 ${item.title.slice(0, 30)}... - ${item.pubDate} -> ${pubDate.toISOString()} (새글: ${isNew})`)
          return isNew
        })
        
        console.log(`🔍 전체 ${items.length}개 중 새 게시글 ${newItems.length}개 필터링됨`)
        
        let importedCount = 0
        
        // 게시글로 변환하여 저장 (모든 파싱된 아이템)
        for (const item of newItems) {
          console.log(`💾 게시글 저장 시도: ${item.title.slice(0, 30)}...`)
          
          // rss_posts 테이블에서 중복 확인 (source_url 기준)
          const { data: existingRssPost, error: rssCheckError } = await supabase
            .from('rss_posts')
            .select('id')
            .eq('source_url', item.link)
            .single()
          
          console.log(`🔍 RSS 중복 확인 결과: ${existingRssPost ? '이미 존재' : '새 RSS 포스트'} (에러: ${rssCheckError?.message || '없음'})`)
          
          if (!existingRssPost) {
            try {
              // 1단계: rss_posts 테이블에 먼저 저장
              const rssPostData = {
                title: item.title,
                description: item.description,
                source_url: item.link,
                published_at: item.pubDate,
                author: item.author,
                image_url: item.imageUrl,
                feed_id: feed.id
              }
              
              console.log(`📝 RSS 포스트 저장:`, JSON.stringify(rssPostData, null, 2))
              
              const { data: rssPostResult, error: rssError } = await supabase
                .from('rss_posts')
                .insert(rssPostData)
                .select()
                .single()
              
              if (rssError) {
                console.error(`❌ RSS 포스트 저장 실패:`, rssError)
                continue
              }
              
              console.log(`✅ RSS 포스트 저장 성공:`, rssPostResult)
              
              // 2단계: posts 테이블에 게시글로 저장 (기존 뉴스 위젯 호환)
              const contentNodes = []
              
              // 이미지가 있으면 먼저 추가
              if (item.imageUrl) {
                contentNodes.push({
                  type: 'image',
                  attrs: {
                    src: item.imageUrl,
                    alt: item.title,
                    title: item.title
                  }
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any)
              }
              
              // 텍스트 설명 추가
              contentNodes.push({
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: item.description.slice(0, 300) + (item.description.length > 300 ? '...' : '')
                  }
                ]
              })
              
              // 원문 링크 추가
              contentNodes.push({
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: '원문 보기: '
                  },
                  {
                    type: 'text',
                    marks: [{ type: 'link', attrs: { href: item.link, target: '_blank' } }],
                    text: item.link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  } as any
                ]
              })
              
              const postData = {
                title: item.title,
                content: JSON.stringify({
                  type: 'doc',
                  content: contentNodes
                }),
                board_id: feed.board_id,
                source_url: item.link,
                user_id: 'dfd784d6-14c1-440f-b879-bb95f15853ab', // RSS 자동 수집용 사용자
                category: 'news'
              }
              
              console.log(`📝 게시글 저장:`, JSON.stringify(postData, null, 2))
              
              const { data: postResult, error: postError } = await supabase
                .from('posts')
                .insert(postData)
                .select()
                .single()
              
              if (postError) {
                console.error(`❌ 게시글 저장 실패:`, postError)
                // RSS 포스트는 저장되었으니 롤백하지 않음
              } else {
                console.log(`✅ 게시글 저장 성공:`, postResult)
                importedCount++
              }
              
            } catch (error) {
              console.error(`❌ 전체 저장 과정 실패:`, error)
            }
          }
        }
        
        // 피드 상태 업데이트
        await supabase
          .from('rss_feeds')
          .update({
            last_fetched_at: new Date().toISOString(),
            error_count: 0,
            last_error: null
          })
          .eq('id', feed.id)
        
        results.push({
          feed_id: feed.id,
          name: feed.name,
          status: 'success',
          imported: importedCount,
          message: `${importedCount}개의 새 게시글을 가져왔습니다.`
        })
        
        totalPostsImported += importedCount
        
      } catch (error) {
        console.error(`RSS 피드 처리 실패 (${feed.url}):`, error)
        
        // 에러 카운트 증가
        await supabase
          .from('rss_feeds')
          .update({
            error_count: (feed.error_count || 0) + 1,
            last_error: error instanceof Error ? error.message : '알 수 없는 오류',
            last_error_at: new Date().toISOString()
          })
          .eq('id', feed.id)
        
        results.push({
          feed_id: feed.id,
          name: feed.name,
          status: 'error',
          message: error instanceof Error ? error.message : '알 수 없는 오류'
        })
      }
    }
    
    // 관련 페이지 캐시 갱신
    revalidatePath('/admin/rss')
    
    // 실행 시간 계산 및 로그 저장
    const executionTime = Date.now() - startTime
    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length
    const status = errorCount === 0 ? 'success' : (successCount > 0 ? 'partial' : 'error')
    
    await saveAutomationLog(
      triggerType,
      status,
      feeds?.length || 0,
      totalPostsImported,
      errorCount > 0 ? `${errorCount}개 피드 처리 실패` : undefined,
      executionTime,
      { results, feedCount: feeds?.length || 0 }
    )
    
    return results
    
  } catch (error) {
    console.error('RSS 피드 일괄 처리 오류:', error)
    
    // 오류 로그 저장
    const executionTime = Date.now() - startTime
    await saveAutomationLog(
      triggerType,
      'error',
      0,
      0,
      error instanceof Error ? error.message : '알 수 없는 오류',
      executionTime,
      { error: error instanceof Error ? error.message : String(error) }
    )
    
    throw error
  }
}

// 특정 RSS 피드 가져오기
export async function fetchSingleRSSFeed(feedId: string) {
  const supabase = createSupabaseClient()
  
  try {
    const { data: feed, error } = await supabase
      .from('rss_feeds')
      .select('*')
      .eq('id', feedId)
      .single()
    
    if (error) throw error
    
    console.log(`🔍 RSS 피드 수동 가져오기 시작: ${feed.name} (${feed.url})`)
    
    const items = await parseRSSFeed(feed.url)
    console.log(`📰 파싱된 RSS 아이템 수: ${items.length}개`)
    
    // 수동 실행에서는 시간 제한 없이 모든 아이템 처리 (최대 10개)
    const newItems = items.slice(0, 10)
    console.log(`📝 처리할 아이템 수: ${newItems.length}개`)
    
    let importedCount = 0
    
    // 게시글로 변환하여 저장
    for (const item of newItems) {
      console.log(`🔍 처리 중: ${item.title}`)
      
      // rss_posts 테이블에서 중복 확인 (source_url 기준)
      const { data: existingRssPost, error: rssCheckError } = await supabase
        .from('rss_posts')
        .select('id')
        .eq('source_url', item.link)
        .single()
      
      console.log(`🔍 중복 확인 결과: ${existingRssPost ? '이미 존재' : '새 RSS 포스트'} (에러: ${rssCheckError?.message || '없음'})`)
      
      if (!existingRssPost) {
        try {
          // 1단계: rss_posts 테이블에 저장
          const rssPostData = {
            title: item.title,
            description: item.description,
            source_url: item.link,
            published_at: item.pubDate,
            author: item.author,
            image_url: item.imageUrl,
            feed_id: feedId
          }
          
          console.log(`📝 RSS 포스트 저장:`, JSON.stringify(rssPostData, null, 2))
          
          const { data: rssResult, error: rssError } = await supabase
            .from('rss_posts')
            .insert(rssPostData)
            .select()
            .single()
          
          if (rssError) {
            console.error(`❌ RSS 포스트 저장 실패:`, rssError)
            continue
          }
          
          console.log(`✅ RSS 포스트 저장 성공:`, rssResult)
          
          // 2단계: posts 테이블에 게시글로 저장 (기존 뉴스 위젯 호환)
          // 본문 길이를 늘리고 이미지 포함
          const cleanDescription = cleanHtml(item.description)
          const fullText = cleanDescription.slice(0, 800) + (cleanDescription.length > 800 ? '...' : '')
          
          // TipTap 호환 content 구조 생성
          const contentNodes = [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: fullText
                }
              ]
            }
          ]
          
          // 이미지가 있으면 이미지 노드 추가
          if (item.imageUrl) {
            contentNodes.unshift({
              type: 'image',
              attrs: {
                src: item.imageUrl,
                alt: item.title,
                title: item.title
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)
          }
          
          // 원문 보기 링크 추가
          contentNodes.push({
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '원문 보기: '
              },
              {
                type: 'text',
                marks: [{ type: 'link', attrs: { href: item.link, target: '_blank' } }],
                text: '풋볼리스트에서 전체 기사 읽기'
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any
            ]
          })
          
          const postData = {
            title: item.title,
            content: JSON.stringify({
              type: 'doc',
              content: contentNodes
            }),
            board_id: feed.board_id,
            source_url: item.link,
            user_id: 'dfd784d6-14c1-440f-b879-bb95f15853ab', // RSS 자동 수집용 사용자
            category: 'news'
          }
          
          console.log(`📝 게시글 저장:`, JSON.stringify(postData, null, 2))
          
          const { data: postResult, error: postError } = await supabase
            .from('posts')
            .insert(postData)
            .select()
            .single()
          
          if (postError) {
            console.error(`❌ 게시글 저장 실패:`, postError)
            // RSS 포스트는 저장되었으니 롤백하지 않음
          } else {
            console.log(`✅ 게시글 저장 성공:`, postResult)
            importedCount++
          }
        } catch (error) {
          console.error('저장 오류:', error)
        }
      }
    }
    
    // 피드 상태 업데이트
    await supabase
      .from('rss_feeds')
      .update({
        last_fetched_at: new Date().toISOString(),
        error_count: 0,
        last_error: null
      })
      .eq('id', feedId)
    
    revalidatePath('/admin/rss')
    
    return {
      feed_id: feedId,
      status: 'success',
      imported: importedCount,
      message: `${importedCount}개의 새 게시글을 가져왔습니다.`
    }
    
  } catch (error) {
    console.error(`RSS 피드 처리 실패 (${feedId}):`, error)
    throw error
  }
}

// RSS 피드 등록
export async function createRSSFeed(formData: FormData) {
  const supabase = createSupabaseClient()
  
  const url = formData.get('url') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const boardId = formData.get('board_id') as string
  
  if (!url || !boardId) {
    throw new Error('URL과 게시판을 선택해주세요.')
  }
  
  try {
    // RSS 피드 유효성 검사
    await parseRSSFeed(url)
    
    const { data, error } = await supabase
      .from('rss_feeds')
      .insert({
        url,
        name: name || null,
        description: description || null,
        board_id: boardId,
        is_active: true
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/admin/rss')
    
    return data
    
  } catch (error) {
    console.error('RSS 피드 등록 오류:', error)
    throw error
  }
}

// RSS 피드 목록 조회
export async function getRSSFeeds() {
  const supabase = createSupabaseClient()
  
  try {
    const { data, error } = await supabase
      .from('rss_feeds')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return data
    
  } catch (error) {
    console.error('RSS 피드 목록 조회 오류:', error)
    throw error
  }
}

// RSS 피드 상태 토글
export async function toggleRSSFeedStatus(feedId: string, isActive: boolean) {
  const supabase = createSupabaseClient()
  
  try {
    const { error } = await supabase
      .from('rss_feeds')
      .update({ is_active: isActive })
      .eq('id', feedId)
    
    if (error) throw error
    
    revalidatePath('/admin/rss')
    
    return { success: true }
    
  } catch (error) {
    console.error('RSS 피드 상태 변경 오류:', error)
    throw error
  }
}

// RSS 피드 삭제
export async function deleteRSSFeed(feedId: string) {
  const supabase = createSupabaseClient()
  
  try {
    const { error } = await supabase
      .from('rss_feeds')
      .delete()
      .eq('id', feedId)
    
    if (error) throw error
    
    revalidatePath('/admin/rss')
    
    return { success: true }
    
  } catch (error) {
    console.error('RSS 피드 삭제 오류:', error)
    throw error
  }
}

// RSS 자동화 로그 조회
export async function getRSSAutomationLogs(limit: number = 20) {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('rss_automation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  
  return data || []
} 