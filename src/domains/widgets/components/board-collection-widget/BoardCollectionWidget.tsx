import React from 'react';
import { createClient } from '@/shared/api/supabaseServer';
import BoardCollectionWidgetClient from './BoardCollectionWidgetClient';
import { BoardCollectionData, BoardPost } from './types';

// 경기결과 카드인지 확인
function isMatchResultCard(content?: string): boolean {
  if (!content) return false;

  // content를 문자열로 변환
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

  return contentStr.includes('match-card') ||
         contentStr.includes('processed-match-card') ||
         contentStr.includes('league-header') ||
         contentStr.includes('match-main') ||
         contentStr.includes('team-logo') ||
         contentStr.includes('score-area') ||
         contentStr.includes('livescore/football/match/');
}

// 이미지 URL 추출
function extractFirstImageUrl(content?: string | object): string | null {
  if (!content) return null;

  try {
    // content를 문자열로 변환
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

    // JSON 형식 (TipTap)
    if (contentStr.trim().startsWith('{')) {
      const obj = typeof content === 'string' ? JSON.parse(content) : content;
      if (obj?.type === 'doc' && Array.isArray(obj.content)) {
        for (const node of obj.content) {
          if (node?.type === 'image' && node?.attrs?.src) {
            const src = node.attrs.src;
            if (!src.includes('api-sports.io')) return src;
          }
          if (node?.type === 'paragraph' && Array.isArray(node.content)) {
            for (const sub of node.content) {
              if (sub?.type === 'image' && sub?.attrs?.src) {
                const src = sub.attrs.src;
                if (!src.includes('api-sports.io')) return src;
              }
            }
          }
        }
      }
    }

    // HTML img 태그
    const imgMatches = contentStr.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
    for (const match of imgMatches) {
      const src = match[1];
      if (!src.includes('api-sports.io') && !src.includes('placeholder.png')) {
        return src;
      }
    }

  } catch (e) {
    console.error('이미지 URL 추출 오류:', e);
  }

  return null;
}

// 여러 게시판에서 최신 게시글 가져오기
async function getBoardsData(): Promise<BoardCollectionData[]> {
  try {
    const supabase = await createClient();

    // DB에서 설정된 게시판 목록 가져오기
    const { data: settings } = await supabase
      .from('board_collection_widget_settings')
      .select('board_id, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    let boardIds: string[] = [];

    if (!settings || settings.length === 0) {
      // 기본 게시판 slug
      const { data: defaultBoards } = await supabase
        .from('boards')
        .select('id')
        .in('slug', ['sports-news', 'soccer']);

      boardIds = defaultBoards?.map(b => b.id) || [];
    } else {
      boardIds = settings.map(s => s.board_id);
    }

    if (boardIds.length === 0) return [];

    // 게시판 정보 가져오기
    const { data: boards } = await supabase
      .from('boards')
      .select('id, name, slug, description')
      .in('id', boardIds);

    if (!boards || boards.length === 0) return [];

    // boardIds 순서대로 boards를 정렬 (display_order 유지)
    const orderedBoards = boardIds
      .map(id => boards.find(b => b.id === id))
      .filter((b): b is NonNullable<typeof b> => b !== null && b !== undefined);

    // 각 게시판별로 데이터 가져오기
    const boardsData = await Promise.all(
      orderedBoards.map(async (board) => {
        // 1. 하위 게시판 ID 찾기 (계층 구조 지원)
        const { data: childBoards } = await supabase
          .from('boards')
          .select('id')
          .eq('parent_id', board.id);

        const boardIds = [board.id];
        if (childBoards && childBoards.length > 0) {
          boardIds.push(...childBoards.map(b => b.id));
        }

        // 2. 최신 게시글 30개 가져오기 (본인 + 하위 게시판 포함)
        const { data: allPosts } = await supabase
          .from('posts')
          .select('id, title, post_number, created_at, content, views, likes, board_id')
          .in('board_id', boardIds)
          .order('created_at', { ascending: false })
          .limit(30);

        let featuredPosts: any[] = [];
        const featuredImages: string[] = [];

        // 이미지 있는 게시글 최대 2개 찾기 (모바일용)
        if (allPosts) {
          for (const post of allPosts) {
            // 경기결과 카드는 제외
            if (isMatchResultCard(post.content)) {
              continue;
            }

            const imageUrl = extractFirstImageUrl(post.content);
            if (imageUrl) {
              featuredPosts.push(post);
              featuredImages.push(imageUrl);

              if (featuredPosts.length >= 2) {
                break;
              }
            }
          }
        }

        // 3. 일반 최신 게시글 12개 가져오기 (본인 + 하위 게시판 포함)
        const { data: recentPosts } = await supabase
          .from('posts')
          .select('id, title, post_number, created_at, content, views, likes, board_id')
          .in('board_id', boardIds)
          .order('created_at', { ascending: false })
          .limit(12);

        // 게시글이 없는 경우에도 게시판 정보는 유지 (탭 표시를 위해)
        if (featuredPosts.length === 0 && (!recentPosts || recentPosts.length === 0)) {
          console.log(`게시판 "${board.name}" (${board.slug})에 표시할 게시글이 없습니다.`);
          return {
            board,
            posts: [],
            featuredImages: []
          };
        }

        // 4. board_id별 slug 매핑 가져오기
        const uniqueBoardIds = Array.from(new Set([
          ...featuredPosts.map(p => p.board_id),
          ...(recentPosts || []).map(p => p.board_id)
        ]));

        const { data: boardSlugs } = await supabase
          .from('boards')
          .select('id, slug')
          .in('id', uniqueBoardIds);

        const boardSlugMap = new Map<string, string>();
        boardSlugs?.forEach(b => {
          boardSlugMap.set(b.id, b.slug || '');
        });

        // 5. 최종 게시글 목록 구성 (이미지 게시글들 + 최신 글들)
        const finalPosts = [];
        const usedIds = new Set<string>();

        // 이미지 게시글들 추가
        featuredPosts.forEach(post => {
          finalPosts.push(post);
          usedIds.add(post.id);
        });

        // 최신 게시글 추가 (중복 제거)
        if (recentPosts) {
          const filteredRecent = recentPosts.filter(p => !usedIds.has(p.id));
          finalPosts.push(...filteredRecent);
        }

        // 포맷팅
        const postsWithExtras = finalPosts.slice(0, 12).map((post: any) => ({
          id: post.id,
          title: post.title,
          post_number: post.post_number,
          created_at: post.created_at,
          content: post.content,
          views: post.views || 0,
          likes: post.likes || 0,
          comment_count: 0,
          board_slug: boardSlugMap.get(post.board_id) || board.slug || '',
          author_nickname: '익명'
        }));

        return {
          board,
          posts: postsWithExtras as BoardPost[],
          featuredImages
        };
      })
    );

    // 모든 설정된 게시판을 표시 (게시글이 없어도 탭은 표시)
    return boardsData;
  } catch (error) {
    console.error('게시판 데이터 조회 오류:', error);
    return [];
  }
}

// 서버 컴포넌트
export default async function BoardCollectionWidget() {
  const boardsData = await getBoardsData();

  if (!boardsData || boardsData.length === 0) {
    return null;
  }

  return <BoardCollectionWidgetClient boardsData={boardsData} />;
}
