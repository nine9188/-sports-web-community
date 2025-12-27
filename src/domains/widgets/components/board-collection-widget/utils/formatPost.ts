import { PostWithContent, BoardPost, PostMetadata, BoardInfo } from '../types';

/**
 * DB에서 조회한 게시글을 UI용 BoardPost로 변환합니다.
 */
export function formatPost(
  post: PostWithContent,
  parentBoard: BoardInfo,
  metadata: PostMetadata
): BoardPost {
  const postBoardId = post.board_id || '';
  const boardInfo = metadata.boardInfos.get(postBoardId);

  // 팀/리그 로고 조회
  const teamLogo = boardInfo?.teamId
    ? metadata.teamLogos.get(boardInfo.teamId) || null
    : null;
  const leagueLogo = boardInfo?.leagueId
    ? metadata.leagueLogos.get(boardInfo.leagueId) || null
    : null;

  return {
    id: post.id,
    title: post.title,
    post_number: post.post_number,
    created_at: post.created_at,
    content: typeof post.content === 'string'
      ? post.content
      : JSON.stringify(post.content),
    views: post.views || 0,
    likes: post.likes || 0,
    comment_count: metadata.commentCounts[post.id] || 0,
    board_slug: boardInfo?.slug || parentBoard.slug || '',
    board_name: boardInfo?.name || parentBoard.name,
    author_nickname: '익명',
    category: post.category || null,
    team_logo: teamLogo,
    league_logo: leagueLogo
  };
}

/**
 * 게시글 배열을 일괄 변환합니다.
 */
export function formatBoardPosts(
  posts: PostWithContent[],
  parentBoard: BoardInfo,
  metadata: PostMetadata
): BoardPost[] {
  return posts.map(post => formatPost(post, parentBoard, metadata));
}
