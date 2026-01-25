// UI 컴포넌트용 유틸

export const CHIP_BUTTONS = [
  {
    id: 'community_inquiry',
    type: 'community_inquiry',
    label: '커뮤니티 이용문의',
    description: '커뮤니티 이용에 관한 문의사항을 도와드리겠습니다.',
    form_config: {
      fields: [
        {
          name: 'inquiry_type',
          type: 'select',
          label: '문의 유형',
          required: true,
          options: [
            { value: 'account', label: '계정 관련' },
            { value: 'usage', label: '이용 방법' },
            { value: 'feature', label: '기능 문의' },
            { value: 'other', label: '기타' }
          ]
        },
        {
          name: 'title',
          type: 'text',
          label: '제목',
          placeholder: '문의 제목을 입력해주세요',
          required: true
        },
        {
          name: 'content',
          type: 'textarea',
          label: '문의 내용',
          placeholder: '상세한 문의 내용을 입력해주세요',
          required: true
        },
        {
          name: 'email',
          type: 'email',
          label: '연락처 이메일',
          placeholder: 'reply@example.com',
          required: true
        }
      ],
      submit_label: '문의 제출하기',
      success_message: '문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.'
    }
  },
  {
    id: 'community_terms',
    type: 'community_terms',
    label: '커뮤니티 약관 및 정보처리방침',
    description: '커뮤니티 약관 및 정보처리방침에 관한 문의를 도와드리겠습니다.',
    form_config: {
      fields: [
        {
          name: 'inquiry_type',
          type: 'select',
          label: '문의 유형',
          required: true,
          options: [
            { value: 'terms', label: '이용약관' },
            { value: 'privacy', label: '개인정보처리방침' },
            { value: 'guidelines', label: '커뮤니티 가이드라인' }
          ]
        },
        {
          name: 'content',
          type: 'textarea',
          label: '문의 내용',
          placeholder: '약관 또는 정책에 대한 문의사항을 입력해주세요',
          required: true
        }
      ],
      submit_label: '문의 제출하기',
      success_message: '약관 관련 문의가 접수되었습니다.'
    }
  },
  {
    id: 'member_report',
    type: 'member_report',
    label: '회원신고',
    description: '부적절한 회원 행동에 대한 신고를 접수하겠습니다.',
    form_config: {
      fields: [
        {
          name: 'reported_user',
          type: 'text',
          label: '신고 대상 회원',
          placeholder: '신고할 회원의 닉네임 또는 ID',
          required: true
        },
        {
          name: 'report_type',
          type: 'select',
          label: '신고 유형',
          required: true,
          options: [
            { value: 'spam', label: '스팸/도배' },
            { value: 'abuse', label: '욕설/비방' },
            { value: 'inappropriate', label: '부적절한 내용' },
            { value: 'impersonation', label: '사칭/사기' },
            { value: 'other', label: '기타' }
          ]
        },
        {
          name: 'content',
          type: 'textarea',
          label: '신고 내용',
          placeholder: '신고 사유를 상세히 설명해주세요',
          required: true
        }
      ],
      submit_label: '신고 접수하기',
      success_message: '신고가 접수되었습니다. 검토 후 적절한 조치를 취하겠습니다.'
    }
  },
  {
    id: 'opinion_submit',
    type: 'opinion_submit',
    label: '의견제출',
    description: '서비스 개선을 위한 의견을 제출해주세요.',
    form_config: {
      fields: [
        {
          name: 'category',
          type: 'select',
          label: '의견 분류',
          required: true,
          options: [
            { value: 'feature', label: '기능 개선' },
            { value: 'ui', label: 'UI/UX 개선' },
            { value: 'content', label: '콘텐츠 관련' },
            { value: 'performance', label: '성능 개선' },
            { value: 'other', label: '기타' }
          ]
        },
        {
          name: 'title',
          type: 'text',
          label: '제목',
          placeholder: '의견 제목을 입력해주세요',
          required: true
        },
        {
          name: 'content',
          type: 'textarea',
          label: '의견 내용',
          placeholder: '구체적인 의견이나 제안사항을 입력해주세요',
          required: true
        }
      ],
      submit_label: '의견 제출하기',
      success_message: '소중한 의견 감사합니다. 서비스 개선에 반영하겠습니다.'
    }
  },
  {
    id: 'post_delete_request',
    type: 'post_delete_request',
    label: '게시글/댓글 삭제요청',
    description: '게시글 또는 댓글 삭제 요청을 처리해드리겠습니다.',
    form_config: {
      fields: [
        {
          name: 'content_type',
          type: 'select',
          label: '삭제 요청 대상',
          required: true,
          options: [
            { value: 'post', label: '게시글' },
            { value: 'comment', label: '댓글' }
          ]
        },
        {
          name: 'content_url',
          type: 'text',
          label: '대상 URL 또는 ID',
          placeholder: '삭제 요청할 게시글/댓글의 URL 또는 ID',
          required: true
        },
        {
          name: 'reason',
          type: 'select',
          label: '삭제 사유',
          required: true,
          options: [
            { value: 'personal', label: '개인정보 포함' },
            { value: 'mistake', label: '실수로 작성' },
            { value: 'inappropriate', label: '부적절한 내용' },
            { value: 'other', label: '기타' }
          ]
        },
        {
          name: 'details',
          type: 'textarea',
          label: '상세 사유',
          placeholder: '삭제 요청 사유를 상세히 설명해주세요',
          required: false
        }
      ],
      submit_label: '삭제 요청하기',
      success_message: '삭제 요청이 접수되었습니다. 검토 후 처리해드리겠습니다.'
    }
  },
  {
    id: 'bug_report',
    type: 'bug_report',
    label: '버그신고',
    description: '발견하신 버그를 신고해주시면 빠르게 수정하겠습니다.',
    form_config: {
      fields: [
        {
          name: 'bug_type',
          type: 'select',
          label: '버그 유형',
          required: true,
          options: [
            { value: 'ui', label: 'UI 오류' },
            { value: 'function', label: '기능 오류' },
            { value: 'performance', label: '성능 문제' },
            { value: 'data', label: '데이터 오류' },
            { value: 'other', label: '기타' }
          ]
        },
        {
          name: 'page_url',
          type: 'text',
          label: '발생 페이지',
          placeholder: '버그가 발생한 페이지 URL',
          required: true
        },
        {
          name: 'description',
          type: 'textarea',
          label: '버그 상세 설명',
          placeholder: '버그 발생 상황과 재현 방법을 상세히 설명해주세요',
          required: true
        },
        {
          name: 'browser',
          type: 'text',
          label: '브라우저 정보',
          placeholder: '예: Chrome 119, Safari 17, Firefox 118',
          required: false
        }
      ],
      submit_label: '버그 신고하기',
      success_message: '버그 신고가 접수되었습니다. 빠르게 수정하겠습니다.'
    }
  }
];

export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diff < 1) return '방금 전';
  if (diff < 60) return `${diff}분 전`;
  if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
  return date.toLocaleDateString('ko-KR');
}

export function scrollToBottom(element: HTMLElement) {
  element.scrollTop = element.scrollHeight;
}
