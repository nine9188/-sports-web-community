import nodemailer from 'nodemailer';

// Brevo SMTP 설정
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // TLS 사용
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://4590football.com';
const LOGO_EMAIL_URL = `${SITE_URL}/logo/4590football-logo-email.png?v=2`;

/**
 * 다크모드 대응 이메일 레이아웃 래퍼
 */
function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <style>
    :root { color-scheme: light only; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border-radius: 8px; overflow: hidden;">
          <!-- Header: 이미지 자체에 배경색 포함 (Gmail 다크모드 대응) -->
          <tr>
            <td align="center" style="padding: 0; font-size: 0; line-height: 0;">
              <img src="${LOGO_EMAIL_URL}" alt="4590 football" width="600" style="display: block; width: 100%; max-width: 600px; height: auto;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td>
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; background-color: #f9fafb; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">&copy; 2025 4590 football. All rights reserved.</p>
              <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">이 이메일은 자동으로 발송되었습니다.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 이메일 발송 기본 함수 (Brevo SMTP 사용)
 */
async function sendEmail({ to, subject, html }: EmailTemplate) {
  try {
    const senderEmail = process.env.SMTP_SENDER_EMAIL || 'noreply@example.com';
    const senderName = process.env.SMTP_SENDER_NAME || '4590 football';

    const info = await transporter.sendMail({
      from: `${senderName} <${senderEmail}>`,
      to: to,
      subject: subject,
      html: html,
    });

    console.log('이메일 발송 성공:', info.messageId);
    return { success: true, data: { messageId: info.messageId } };
  } catch (error) {
    console.error('이메일 발송 오류:', error);
    return { success: false, error: '이메일 발송 중 오류가 발생했습니다.' };
  }
}

/**
 * 아이디 찾기 결과 이메일 발송
 */
export async function sendIdRecoveryEmail(email: string, verificationCode: string, username: string) {
  const subject = '[4590 football] 아이디 찾기 - 인증코드';
  const html = emailLayout(`
      <div style="padding: 40px 24px; background: white;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">아이디 찾기 결과</h2>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">회원님의 아이디는 다음과 같습니다:</p>
          <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: bold;">${username}</p>
        </div>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>보안을 위해</strong> 이 이메일을 받지 않으셨다면 무시하시기 바랍니다.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${SITE_URL}/signin"
             style="display: inline-block; background: #374151; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            로그인하기
          </a>
        </div>
      </div>
  `);

  return sendEmail({ to: email, subject, html });
}

/**
 * 비밀번호 재설정 이메일 발송
 */
export async function sendPasswordResetEmail(email: string, resetToken: string, username: string) {
  const resetUrl = `${SITE_URL}/help/reset-password?token=${resetToken}`;
  const subject = '[4590 football] 비밀번호 재설정 요청';

  const html = emailLayout(`
      <div style="padding: 40px 24px; background: white;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">비밀번호 재설정</h2>

        <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
          안녕하세요, <strong>${username}</strong>님!<br>
          비밀번호 재설정을 요청하셨습니다.
        </p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">
            아래 버튼을 클릭하여 새로운 비밀번호를 설정하세요:
          </p>
          <div style="text-align: center;">
            <a href="${resetUrl}"
               style="display: inline-block; background: #374151; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
              비밀번호 재설정하기
            </a>
          </div>
        </div>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: bold;">중요 안내사항:</p>
          <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px;">
            <li>이 링크는 30분간만 유효합니다.</li>
            <li>비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요.</li>
            <li>계정 보안을 위해 링크를 다른 사람과 공유하지 마세요.</li>
          </ul>
        </div>

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
          버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
          <span style="color: #374151; word-break: break-all;">${resetUrl}</span>
        </p>
      </div>
  `);

  return sendEmail({ to: email, subject, html });
}

/**
 * 회원가입 이메일 인증 발송
 */
export async function sendSignupVerificationEmail(email: string, verificationToken: string, username: string) {
  const verifyUrl = `${SITE_URL}/auth/verify-email?token=${verificationToken}`;
  const subject = '[4590 football] 회원가입 이메일 인증';

  const html = emailLayout(`
      <div style="padding: 40px 24px; background: white;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">회원가입을 환영합니다!</h2>

        <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
          안녕하세요, <strong>${username}</strong>님!<br>
          4590 football에 가입해주셔서 감사합니다.<br>
          아래 버튼을 클릭하여 이메일 인증을 완료해주세요.
        </p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">
            이메일 인증 버튼을 클릭하면 가입이 완료됩니다:
          </p>
          <div style="text-align: center;">
            <a href="${verifyUrl}"
               style="display: inline-block; background: #374151; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
              이메일 인증하기
            </a>
          </div>
        </div>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: bold;">중요 안내사항:</p>
          <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px;">
            <li>이 링크는 24시간 동안 유효합니다.</li>
            <li>회원가입을 요청하지 않으셨다면 이 이메일을 무시하세요.</li>
            <li>계정 보안을 위해 링크를 다른 사람과 공유하지 마세요.</li>
          </ul>
        </div>

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
          버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
          <span style="color: #374151; word-break: break-all;">${verifyUrl}</span>
        </p>
      </div>
  `);

  return sendEmail({ to: email, subject, html });
}

/**
 * 인증 코드 발송 (아이디 찾기용)
 */
export async function sendVerificationCodeEmail(email: string, verificationCode: string) {
  const subject = '[4590 football] 아이디 찾기 - 인증코드';

  const html = emailLayout(`
      <div style="padding: 40px 24px; background: white;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">아이디 찾기 인증</h2>

        <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
          아이디 찾기를 위한 인증코드를 발송해드립니다.
        </p>

        <div style="background: #f9fafb; border: 2px solid #374151; border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">인증코드</p>
          <p style="margin: 0; color: #1f2937; font-size: 32px; font-weight: bold; letter-spacing: 4px; font-family: 'Courier New', monospace;">
            ${verificationCode}
          </p>
        </div>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>유효시간:</strong> 이 인증코드는 5분간 유효합니다.<br>
            <strong>보안:</strong> 이 코드를 다른 사람과 공유하지 마세요.
          </p>
        </div>
      </div>
  `);

  return sendEmail({ to: email, subject, html });
}
