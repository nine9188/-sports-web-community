export function getStatusText(status: string): string {
  switch (status) {
    case 'pending': return '대기 중';
    case 'reviewed': return '검토 완료';
    case 'dismissed': return '기각';
    case 'resolved': return '해결';
    default: return status;
  }
}

export function getTargetTypeText(type: string): string {
  switch (type) {
    case 'post': return '게시글';
    case 'comment': return '댓글';
    case 'user': return '사용자';
    case 'match_comment': return '응원 댓글';
    default: return type;
  }
}

export function getActionConfirmMessage(action: string, suspendDays?: number): string {
  switch (action) {
    case 'delete':
      return '정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.';
    case 'hide':
      return '해당 내용을 숨김 처리하시겠습니까?';
    case 'suspend_user':
      return `사용자를 ${suspendDays || 7}일간 정지시키겠습니까?`;
    case 'suspend_author':
      return `작성자를 ${suspendDays || 7}일간 정지시키겠습니까?`;
    default:
      return '이 작업을 실행하시겠습니까?';
  }
}

export const STATUS_BADGE_VARIANTS: Record<string, string> = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
  reviewed: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
  dismissed: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
  resolved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
};

export function calculateDropdownPosition(
  buttonElement: HTMLButtonElement,
  estimatedHeight: number
): { top: number; left: number } {
  const rect = buttonElement.getBoundingClientRect();
  const dropdownWidth = 208;
  const dropdownHeight = Math.min(estimatedHeight, 384);
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = rect.right + window.scrollX - dropdownWidth;
  let top = rect.bottom + window.scrollY + 8;

  if (left < 10) {
    left = rect.left + window.scrollX;
  }

  if (left + dropdownWidth > viewportWidth - 10) {
    left = viewportWidth - dropdownWidth - 10;
  }

  if (top + dropdownHeight > viewportHeight + window.scrollY - 10) {
    top = rect.top + window.scrollY - dropdownHeight - 8;
    if (top < window.scrollY + 10) {
      top = window.scrollY + 10;
    }
  }

  return { top, left };
}

export function estimateDropdownHeight(targetType: string): number {
  if (targetType === 'post' || targetType === 'comment' || targetType === 'match_comment') {
    return 250;
  }
  if (targetType === 'user') {
    return 200;
  }
  return 100;
}
