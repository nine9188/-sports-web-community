module.exports = {
  types: [
    { value: 'feat', name: 'feat:     새로운 기능 추가' },
    { value: 'fix', name: 'fix:      버그 수정' },
    { value: 'docs', name: 'docs:     문서 변경' },
    { value: 'style', name: 'style:    코드 포맷팅, 세미콜론 누락, 코드 변경이 없는 경우' },
    { value: 'refactor', name: 'refactor: 코드 리팩토링' },
    { value: 'perf', name: 'perf:     성능 개선' },
    { value: 'test', name: 'test:     테스트 추가 및 수정' },
    { value: 'chore', name: 'chore:    빌드 프로세스 혹은 문서 생성과 같은 도구 변경' },
    { value: 'revert', name: 'revert:   이전 커밋으로 되돌림' },
    { value: 'wip', name: 'wip:      작업 진행 중' }
  ],
  
  scopes: [
    { name: '컴포넌트' },
    { name: '페이지' },
    { name: '레이아웃' },
    { name: 'API' },
    { name: '스타일' },
    { name: '유틸리티' },
    { name: '설정' },
    { name: '테스트' },
    { name: '기타' }
  ],
  
  allowTicketNumber: false,
  isTicketNumberRequired: false,
  
  messages: {
    type: '어떤 유형의 변경인가요?',
    scope: '어떤 영역의 변경인가요? (선택사항):',
    subject: '변경사항에 대한 짧은 설명:',
    body: '변경사항에 대한 자세한 설명 (선택사항):\n',
    breaking: '주요 변경사항이 있나요? (선택사항):\n',
    footer: '관련된 이슈가 있나요? 예: #31, #34 (선택사항):\n',
    confirmCommit: '위 내용으로 커밋하시겠습니까?'
  },
  
  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],
  skipQuestions: ['body', 'footer'],
  subjectLimit: 100
}; 