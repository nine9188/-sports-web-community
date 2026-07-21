import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { sendEmail } from '../src/shared/services/email';

async function main() {
  const targetEmail = process.argv[2] || 'xotn1601@gmail.com';
  const subject = process.argv[3] || '[4590 football] 테스트 이메일 발송입니다';
  const content = process.argv[4] || '안녕하세요! support@4590fb.com 에서 발송된 테스트 이메일입니다.';

  console.log(`Sending email to ${targetEmail}...`);
  console.log(`Sender: ${process.env.SMTP_SENDER_EMAIL}`);

  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 500px;">
      <h2 style="color: #111827;">4590 football 테스트 이메일</h2>
      <p style="color: #374151; font-size: 15px; line-height: 1.6;">${content}</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">발신 주소: ${process.env.SMTP_SENDER_EMAIL || 'support@4590fb.com'}</p>
    </div>
  `;

  const result = await sendEmail({
    to: targetEmail,
    subject: subject,
    html: html,
  });

  if (result.success) {
    console.log('✅ 이메일 발송 성공!', result.data);
  } else {
    console.error('❌ 이메일 발송 실패:', result.error);
  }
}

main().catch(console.error);
