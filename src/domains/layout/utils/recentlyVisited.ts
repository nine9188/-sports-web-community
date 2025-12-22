const STORAGE_KEY = 'recently_visited_boards';
const EXPANDED_KEY = 'recently_visited_expanded';
const MAX_ITEMS = 10;

export interface RecentBoard {
  id: string;
  slug: string;
  name: string;
  visitedAt: number;
}

// SSR 안전한 localStorage 접근
function isClient(): boolean {
  return typeof window !== 'undefined';
}

// 최근 방문 목록 가져오기
export function getRecentlyVisited(): RecentBoard[] {
  if (!isClient()) return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting recently visited:', error);
    return [];
  }
}

// 최근 방문 추가
export function addRecentlyVisited(board: Omit<RecentBoard, 'visitedAt'>): void {
  if (!isClient()) return;

  try {
    const current = getRecentlyVisited();

    // 이미 있으면 제거 (맨 앞으로 이동시키기 위해)
    const filtered = current.filter(b => b.id !== board.id);

    // 맨 앞에 추가
    const updated: RecentBoard[] = [
      { ...board, visitedAt: Date.now() },
      ...filtered
    ].slice(0, MAX_ITEMS); // 최대 개수 제한

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // storage 이벤트 발생시켜 다른 탭/컴포넌트에 알림
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: JSON.stringify(updated)
    }));
  } catch (error) {
    console.error('Error adding recently visited:', error);
  }
}

// 특정 항목 제거
export function removeRecentlyVisited(boardId: string): void {
  if (!isClient()) return;

  try {
    const current = getRecentlyVisited();
    const updated = current.filter(b => b.id !== boardId);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: JSON.stringify(updated)
    }));
  } catch (error) {
    console.error('Error removing recently visited:', error);
  }
}

// 전체 삭제
export function clearRecentlyVisited(): void {
  if (!isClient()) return;

  try {
    localStorage.removeItem(STORAGE_KEY);

    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: null
    }));
  } catch (error) {
    console.error('Error clearing recently visited:', error);
  }
}

// 펼침 상태 가져오기
export function getExpandedState(): boolean {
  if (!isClient()) return false;

  try {
    const data = localStorage.getItem(EXPANDED_KEY);
    return data === 'true';
  } catch {
    return false;
  }
}

// 펼침 상태 저장
export function setExpandedState(expanded: boolean): void {
  if (!isClient()) return;

  try {
    localStorage.setItem(EXPANDED_KEY, String(expanded));
  } catch (error) {
    console.error('Error saving expanded state:', error);
  }
}
