module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // 새로운 기능
        'fix', // 버그 수정
        'docs', // 문서 변경
        'style', // 코드 포맷팅, 세미콜론 누락, 코드 변경이 없는 경우
        'refactor', // 코드 리팩토링
        'test', // 테스트 코드
        'chore', // 빌드 업무 수정, 패키지 매니저 수정
        'perf', // 성능 개선
        'ci', // CI 관련 설정 수정
        'build', // 빌드 시스템 또는 외부 종속성에 영향을 미치는 변경사항
        'revert', // 이전 커밋으로 되돌림
      ],
    ],
    'subject-full-stop': [0, 'never'],
    'subject-case': [0, 'never'],
  },
}; 