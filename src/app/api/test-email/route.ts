import { NextResponse } from 'next/server';
import { sendPasswordResetEmail, sendIdRecoveryEmail, sendSignupVerificationEmail, sendVerificationCodeEmail } from '@/shared/services/email';

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const to = searchParams.get('to');
  const type = searchParams.get('type'); // password | id | signup | code | all

  if (!to) {
    return NextResponse.json({
      error: '사용법: ?to=이메일&type=all',
      types: {
        password: '비밀번호 재설정 이메일',
        id: '아이디 찾기 결과 이메일',
        signup: '회원가입 인증 이메일',
        code: '인증코드 이메일',
        all: '전부 발송',
      },
    }, { status: 400 });
  }

  const results: Record<string, unknown> = {};

  try {
    if (type === 'password' || type === 'all') {
      results.password = await sendPasswordResetEmail(to, 'test-reset-token-abc123', '테스트유저');
    }

    if (type === 'id' || type === 'all') {
      results.id = await sendIdRecoveryEmail(to, '123456', 'te***er');
    }

    if (type === 'signup' || type === 'all') {
      results.signup = await sendSignupVerificationEmail(to, 'test-verify-token-xyz789', '테스트유저');
    }

    if (type === 'code' || type === 'all') {
      results.code = await sendVerificationCodeEmail(to, '948271');
    }

    if (Object.keys(results).length === 0) {
      return NextResponse.json({
        error: `알 수 없는 type: ${type}`,
        validTypes: ['password', 'id', 'signup', 'code', 'all'],
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, to, results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
