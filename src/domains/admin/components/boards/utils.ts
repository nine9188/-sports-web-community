import type { Board } from './types';

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

export function getParentLevel(boards: Board[], boardId: string): number {
  let level = 0;
  let current = boards.find((b) => b.id === boardId);

  while (current && current.parent_id) {
    level++;
    current = boards.find((b) => b.id === current?.parent_id);
  }

  return level;
}

export function getAccessLevelText(accessLevel: string): string {
  switch (accessLevel) {
    case 'public':
      return '공개';
    case 'members':
      return '회원 전용';
    case 'admin':
      return '관리자 전용';
    default:
      return accessLevel;
  }
}

export function validateSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9\-_]+$/;
  return slugRegex.test(slug);
}

export function isSlugExists(boards: Board[], slug: string, excludeId?: string): boolean {
  return boards.some(
    (board) => board.slug === slug && (!excludeId || board.id !== excludeId)
  );
}

export function isChildBoard(boards: Board[], parentId: string, checkId: string): boolean {
  const children = boards.filter((b) => b.parent_id === checkId);
  return children.some((child) => child.id === parentId || isChildBoard(boards, parentId, child.id));
}
