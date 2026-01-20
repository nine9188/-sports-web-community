/**
 * 챗봇 시스템에서 사용되는 메시지 상수
 * 다국어 지원을 위해 모든 메시지 문자열을 한 곳에서 관리합니다.
 */

export const CHATBOT_MESSAGES = {
  // 인사말
  GREETING: '안녕하세요! 무엇을 도와드릴까요?',

  // 도움 제안
  ASK_MORE_HELP: '더 도와드릴게 있을까요?',
  WHAT_CAN_I_HELP: '무엇을 도와드릴까요?',

  // 완료 메시지
  REPORT_SUBMITTED: '신고가 접수되었습니다. 검토 후 적절한 조치를 취하겠습니다.',
  INQUIRY_SUBMITTED: '문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.',
  OPINION_SUBMITTED: '소중한 의견 감사합니다. 서비스 개선에 반영하겠습니다.',
  DELETE_REQUEST_SUBMITTED: '삭제 요청이 접수되었습니다. 검토 후 처리해드리겠습니다.',
  BUG_REPORT_SUBMITTED: '버그 신고가 접수되었습니다. 빠르게 수정하겠습니다.',
  TERMS_INQUIRY_SUBMITTED: '약관 관련 문의가 접수되었습니다.',

  // 완료 칩 버튼
  COMPLETION_OKAY: '괜찮아요',
  COMPLETION_ANOTHER_INQUIRY: '네 다른문의 할게요',

  // 에러 메시지
  ERROR_MESSAGE_SEND_FAILED: '메시지 전송에 실패했습니다.',
  ERROR_FORM_SUBMIT_FAILED: '폼 제출에 실패했습니다.',
  ERROR_REQUEST_FAILED: '요청 처리에 실패했습니다.',
  ERROR_SUBMIT_FAILED: '제출 중 오류가 발생했습니다. 다시 시도해주세요.',

  // 로딩 상태
  LOADING_SUBMITTING: '제출 중...',
  LOADING_SENDING: '전송 중...',

  // 빈 상태
  EMPTY_MESSAGES: '메시지가 없습니다',

  // 대화 목록
  NEW_CONVERSATION: '새로운 대화',
  CONVERSATION_LIST: '대화 목록',
  NO_CONVERSATIONS: '대화 내역이 없습니다',
  START_NEW_CONVERSATION: '새 대화 시작하기',

  // 대화 만료
  CONVERSATION_EXPIRED: '하루동안 채팅이 진행되지 않아 채팅을 종료합니다.',

  // 입력 플레이스홀더
  PLACEHOLDER_MESSAGE: '메시지를 입력하세요...',

  // 폼 라벨
  FORM_SUBMIT_COMPLETE: '제출 완료',

  // 버튼 라벨
  BUTTON_CANCEL: '취소',
  BUTTON_SEND: '전송',
  BUTTON_SUBMIT: '제출',
} as const;

/**
 * 칩 타입별 봇 응답 메시지
 */
export const CHIP_TYPE_RESPONSES: Record<string, string> = {
  community_inquiry: '커뮤니티 이용에 관한 문의사항을 작성해주세요.',
  community_terms: '약관 및 정책에 대한 문의사항을 작성해주세요.',
  member_report: '신고할 회원과 신고 사유를 상세히 작성해주세요.',
  opinion_submit: '서비스 개선을 위한 의견을 작성해주세요.',
  post_delete_request: '삭제 요청할 게시글 또는 댓글 정보를 입력해주세요.',
  bug_report: '발견하신 버그에 대한 정보를 상세히 작성해주세요.',
};

/**
 * 다국어 지원을 위한 타입
 * 향후 i18n 라이브러리 도입 시 사용
 */
export type MessageKey = keyof typeof CHATBOT_MESSAGES;

/**
 * 메시지 가져오기 헬퍼 함수
 * 향후 다국어 지원 시 이 함수를 통해 언어별 메시지를 반환할 수 있습니다.
 */
export function getMessage(key: MessageKey, locale: string = 'ko'): string {
  // TODO: 다국어 지원 시 locale에 따라 다른 메시지 반환
  return CHATBOT_MESSAGES[key];
}

/**
 * 칩 타입 응답 메시지 가져오기
 */
export function getChipTypeResponse(chipType: string, locale: string = 'ko'): string {
  // TODO: 다국어 지원 시 locale에 따라 다른 메시지 반환
  return CHIP_TYPE_RESPONSES[chipType] || '';
}
