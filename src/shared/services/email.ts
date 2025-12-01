import { Resend } from 'resend';

// Resend 인스턴스를 지연 초기화하여 빌드 시 에러 방지
let resend: Resend | null = null;

function getResendClient() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

/**
 * 이메일 발송 기본 함수
 */
async function sendEmail({ to, subject, html }: EmailTemplate) {
  try {
    const resendClient = getResendClient();
    const { data, error } = await resendClient.emails.send({
      from: 'SPORTS <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('이메일 발송 오류:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('이메일 발송 중 오류:', error);
    return { success: false, error: '이메일 발송 중 오류가 발생했습니다.' };
  }
}

/**
 * 아이디 찾기 인증 코드 이메일 발송
 */
export async function sendIdRecoveryEmail(email: string, verificationCode: string, username: string) {
  const subject = '[SPORTS] 아이디 찾기 - 인증코드';
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">SPORTS</h1>
        <p style="color: #cbd5e1; margin: 10px 0 0 0; font-size: 16px;">스포츠 커뮤니티</p>
      </div>
      
      <div style="padding: 40px 20px; background: white;">
        <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">아이디 찾기 결과</h2>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">회원님의 아이디는 다음과 같습니다:</p>
          <p style="margin: 0; color: #1e293b; font-size: 18px; font-weight: bold;">${username}</p>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>보안을 위해</strong> 이 이메일을 받지 않으셨다면 무시하시기 바랍니다.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/signin" 
             style="display: inline-block; background: #1e293b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            로그인하기
          </a>
        </div>
      </div>
      
      <div style="padding: 20px; background: #f8fafc; text-align: center; color: #64748b; font-size: 12px;">
        <p style="margin: 0;">© 2024 SPORTS Community. All rights reserved.</p>
        <p style="margin: 5px 0 0 0;">이 이메일은 자동으로 발송되었습니다.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * 비밀번호 재설정 이메일 발송
 */
export async function sendPasswordResetEmail(email: string, resetToken: string, username: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/help/reset-password?token=${resetToken}`;
  const subject = '[SPORTS] 비밀번호 재설정 요청';
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">SPORTS</h1>
        <p style="color: #cbd5e1; margin: 10px 0 0 0; font-size: 16px;">스포츠 커뮤니티</p>
      </div>
      
      <div style="padding: 40px 20px; background: white;">
        <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">비밀번호 재설정</h2>
        
        <p style="color: #64748b; line-height: 1.6; margin: 0 0 20px 0;">
          안녕하세요, <strong>${username}</strong>님!<br>
          비밀번호 재설정을 요청하셨습니다.
        </p>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 15px 0; color: #64748b; font-size: 14px;">
            아래 버튼을 클릭하여 새로운 비밀번호를 설정하세요:
          </p>
          <div style="text-align: center;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
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
        
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
          버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
          <span style="color: #3b82f6; word-break: break-all;">${resetUrl}</span>
        </p>
      </div>
      
      <div style="padding: 20px; background: #f8fafc; text-align: center; color: #64748b; font-size: 12px;">
        <p style="margin: 0;">© 2024 SPORTS Community. All rights reserved.</p>
        <p style="margin: 5px 0 0 0;">이 이메일은 자동으로 발송되었습니다.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * 인증 코드 발송 (아이디 찾기용)
 */
export async function sendVerificationCodeEmail(email: string, verificationCode: string) {
  const subject = '[SPORTS] 아이디 찾기 - 인증코드';
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">SPORTS</h1>
        <p style="color: #cbd5e1; margin: 10px 0 0 0; font-size: 16px;">스포츠 커뮤니티</p>
      </div>
      
      <div style="padding: 40px 20px; background: white;">
        <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">아이디 찾기 인증</h2>
        
        <p style="color: #64748b; line-height: 1.6; margin: 0 0 20px 0;">
          아이디 찾기를 위한 인증코드를 발송해드립니다.
        </p>
        
        <div style="background: #f8fafc; border: 2px solid #1e293b; border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">인증코드</p>
          <p style="margin: 0; color: #1e293b; font-size: 32px; font-weight: bold; letter-spacing: 4px; font-family: 'Courier New', monospace;">
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
      
      <div style="padding: 20px; background: #f8fafc; text-align: center; color: #64748b; font-size: 12px;">
        <p style="margin: 0;">© 2024 SPORTS Community. All rights reserved.</p>
        <p style="margin: 5px 0 0 0;">이 이메일은 자동으로 발송되었습니다.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
} 