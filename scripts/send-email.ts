import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { sendEmail } from '../src/shared/services/email';

async function main() {
  const args = process.argv.slice(2);
  let to = '';
  let subject = '';
  let content = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--to' && args[i + 1]) to = args[i + 1];
    if (args[i] === '--subject' && args[i + 1]) subject = args[i + 1];
    if (args[i] === '--content' && args[i + 1]) content = args[i + 1];
  }

  if (!to || !subject || !content) {
    console.log('\n❌ 사용 방법:');
    console.log('npx tsx scripts/send-email.ts --to "수신자이메일" --subject "제목" --content "내용"\n');
    process.exit(1);
  }

  console.log(`\n📧 이메일 발송 중...`);
  console.log(`- 수신자: ${to}`);
  console.log(`- 발신자: ${process.env.SMTP_SENDER_EMAIL || 'support@4590fb.com'}`);
  console.log(`- 제목: ${subject}\n`);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #374151; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #111827; margin: 0; font-size: 20px;">4590 football 안내</h2>
      </div>
      <div style="color: #374151; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${content}</div>
      <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #f3f4f6; color: #9ca3af; font-size: 12px; text-align: center;">
        본 메일은 4590 football 고객지원팀(${process.env.SMTP_SENDER_EMAIL || 'support@4590fb.com'})에서 발송되었습니다.
      </div>
    </div>
  `;

  const result = await sendEmail({ to, subject, html });

  if (result.success) {
    console.log('✅ 이메일이 성공적으로 전송되었습니다!', result.data);
  } else {
    console.error('❌ 이메일 전송 실패:', result.error);
  }
}

main().catch(console.error);
