const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://4590football.com';
const LOGO_URL = `${SITE_URL}/logo/4590football-logo.png`;

function emailLayout(content: string, mode: 'light' | 'dark' = 'light'): string {
  const d = mode === 'dark';
  return `<div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;border-radius:8px;overflow:hidden;">
    <div style="background:${d ? '#1D1D1D' : '#ffffff'};padding:32px 20px;text-align:center;border-bottom:1px solid ${d ? '#404040' : '#e5e7eb'};">
      <img src="${LOGO_URL}" alt="4590 football" width="160" style="display:inline-block;height:auto;${d ? 'filter:brightness(0) invert(1);' : ''}" />
    </div>
    ${content}
    <div style="padding:20px;background:${d ? '#181818' : '#f9fafb'};text-align:center;">
      <p style="margin:0;color:${d ? '#888' : '#9ca3af'};font-size:12px;">&copy; 2025 4590 football. All rights reserved.</p>
      <p style="margin:5px 0 0 0;color:${d ? '#888' : '#9ca3af'};font-size:12px;">이 이메일은 자동으로 발송되었습니다.</p>
    </div>
  </div>`;
}

const templates: Record<string, { label: string; light: string; dark: string }> = {
  password: {
    label: '비밀번호 재설정',
    light: emailLayout(`<div style="padding:40px 24px;background:white;">
      <h2 style="color:#1f2937;margin:0 0 20px 0;font-size:24px;">비밀번호 재설정</h2>
      <p style="color:#6b7280;line-height:1.6;margin:0 0 20px 0;">안녕하세요, <strong>테스트유저</strong>님!<br>비밀번호 재설정을 요청하셨습니다.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 15px 0;color:#6b7280;font-size:14px;">아래 버튼을 클릭하여 새로운 비밀번호를 설정하세요:</p>
        <div style="text-align:center;"><a href="#" style="display:inline-block;background:#374151;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:500;font-size:16px;">비밀번호 재설정하기</a></div>
      </div>
      <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:15px;margin:20px 0;">
        <p style="margin:0 0 10px 0;color:#92400e;font-size:14px;font-weight:bold;">중요 안내사항:</p>
        <ul style="margin:0;padding-left:20px;color:#92400e;font-size:14px;"><li>이 링크는 30분간만 유효합니다.</li><li>비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요.</li><li>계정 보안을 위해 링크를 다른 사람과 공유하지 마세요.</li></ul>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:20px 0 0 0;">버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br><span style="color:#374151;word-break:break-all;">${SITE_URL}/help/reset-password?token=example-token</span></p>
    </div>`),
    dark: emailLayout(`<div style="padding:40px 24px;background:#1D1D1D;">
      <h2 style="color:#F0F0F0;margin:0 0 20px 0;font-size:24px;">비밀번호 재설정</h2>
      <p style="color:#CCCCCC;line-height:1.6;margin:0 0 20px 0;">안녕하세요, <strong style="color:#F0F0F0;">테스트유저</strong>님!<br>비밀번호 재설정을 요청하셨습니다.</p>
      <div style="background:#2D2D2D;border:1px solid #404040;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 15px 0;color:#CCCCCC;font-size:14px;">아래 버튼을 클릭하여 새로운 비밀번호를 설정하세요:</p>
        <div style="text-align:center;"><a href="#" style="display:inline-block;background:#F0F0F0;color:#1D1D1D;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:500;font-size:16px;">비밀번호 재설정하기</a></div>
      </div>
      <div style="background:#3D2E00;border:1px solid #7A5C00;border-radius:8px;padding:15px;margin:20px 0;">
        <p style="margin:0 0 10px 0;color:#FCD34D;font-size:14px;font-weight:bold;">중요 안내사항:</p>
        <ul style="margin:0;padding-left:20px;color:#FCD34D;font-size:14px;"><li>이 링크는 30분간만 유효합니다.</li><li>비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요.</li><li>계정 보안을 위해 링크를 다른 사람과 공유하지 마세요.</li></ul>
      </div>
      <p style="color:#CCCCCC;font-size:14px;line-height:1.6;margin:20px 0 0 0;">버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br><span style="color:#9CA3AF;word-break:break-all;">${SITE_URL}/help/reset-password?token=example-token</span></p>
    </div>`, 'dark'),
  },
  id: {
    label: '아이디 찾기 결과',
    light: emailLayout(`<div style="padding:40px 24px;background:white;">
      <h2 style="color:#1f2937;margin:0 0 20px 0;font-size:24px;">아이디 찾기 결과</h2>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 10px 0;color:#6b7280;font-size:14px;">회원님의 아이디는 다음과 같습니다:</p>
        <p style="margin:0;color:#1f2937;font-size:18px;font-weight:bold;">te***er</p>
      </div>
      <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:15px;margin:20px 0;">
        <p style="margin:0;color:#92400e;font-size:14px;"><strong>보안을 위해</strong> 이 이메일을 받지 않으셨다면 무시하시기 바랍니다.</p>
      </div>
      <div style="text-align:center;margin:30px 0;"><a href="#" style="display:inline-block;background:#374151;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:500;">로그인하기</a></div>
    </div>`),
    dark: emailLayout(`<div style="padding:40px 24px;background:#1D1D1D;">
      <h2 style="color:#F0F0F0;margin:0 0 20px 0;font-size:24px;">아이디 찾기 결과</h2>
      <div style="background:#2D2D2D;border:1px solid #404040;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 10px 0;color:#CCCCCC;font-size:14px;">회원님의 아이디는 다음과 같습니다:</p>
        <p style="margin:0;color:#F0F0F0;font-size:18px;font-weight:bold;">te***er</p>
      </div>
      <div style="background:#3D2E00;border:1px solid #7A5C00;border-radius:8px;padding:15px;margin:20px 0;">
        <p style="margin:0;color:#FCD34D;font-size:14px;"><strong style="color:#FDE68A;">보안을 위해</strong> 이 이메일을 받지 않으셨다면 무시하시기 바랍니다.</p>
      </div>
      <div style="text-align:center;margin:30px 0;"><a href="#" style="display:inline-block;background:#F0F0F0;color:#1D1D1D;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:500;">로그인하기</a></div>
    </div>`, 'dark'),
  },
  signup: {
    label: '회원가입 인증',
    light: emailLayout(`<div style="padding:40px 24px;background:white;">
      <h2 style="color:#1f2937;margin:0 0 20px 0;font-size:24px;">회원가입을 환영합니다!</h2>
      <p style="color:#6b7280;line-height:1.6;margin:0 0 20px 0;">안녕하세요, <strong>테스트유저</strong>님!<br>4590 football에 가입해주셔서 감사합니다.<br>아래 버튼을 클릭하여 이메일 인증을 완료해주세요.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 15px 0;color:#6b7280;font-size:14px;">이메일 인증 버튼을 클릭하면 가입이 완료됩니다:</p>
        <div style="text-align:center;"><a href="#" style="display:inline-block;background:#374151;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:500;font-size:16px;">이메일 인증하기</a></div>
      </div>
      <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:15px;margin:20px 0;">
        <p style="margin:0 0 10px 0;color:#92400e;font-size:14px;font-weight:bold;">중요 안내사항:</p>
        <ul style="margin:0;padding-left:20px;color:#92400e;font-size:14px;"><li>이 링크는 24시간 동안 유효합니다.</li><li>회원가입을 요청하지 않으셨다면 이 이메일을 무시하세요.</li><li>계정 보안을 위해 링크를 다른 사람과 공유하지 마세요.</li></ul>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:20px 0 0 0;">버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br><span style="color:#374151;word-break:break-all;">${SITE_URL}/auth/verify-email?token=example-token</span></p>
    </div>`),
    dark: emailLayout(`<div style="padding:40px 24px;background:#1D1D1D;">
      <h2 style="color:#F0F0F0;margin:0 0 20px 0;font-size:24px;">회원가입을 환영합니다!</h2>
      <p style="color:#CCCCCC;line-height:1.6;margin:0 0 20px 0;">안녕하세요, <strong style="color:#F0F0F0;">테스트유저</strong>님!<br>4590 football에 가입해주셔서 감사합니다.<br>아래 버튼을 클릭하여 이메일 인증을 완료해주세요.</p>
      <div style="background:#2D2D2D;border:1px solid #404040;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 15px 0;color:#CCCCCC;font-size:14px;">이메일 인증 버튼을 클릭하면 가입이 완료됩니다:</p>
        <div style="text-align:center;"><a href="#" style="display:inline-block;background:#F0F0F0;color:#1D1D1D;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:500;font-size:16px;">이메일 인증하기</a></div>
      </div>
      <div style="background:#3D2E00;border:1px solid #7A5C00;border-radius:8px;padding:15px;margin:20px 0;">
        <p style="margin:0 0 10px 0;color:#FCD34D;font-size:14px;font-weight:bold;">중요 안내사항:</p>
        <ul style="margin:0;padding-left:20px;color:#FCD34D;font-size:14px;"><li>이 링크는 24시간 동안 유효합니다.</li><li>회원가입을 요청하지 않으셨다면 이 이메일을 무시하세요.</li><li>계정 보안을 위해 링크를 다른 사람과 공유하지 마세요.</li></ul>
      </div>
      <p style="color:#CCCCCC;font-size:14px;line-height:1.6;margin:20px 0 0 0;">버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br><span style="color:#9CA3AF;word-break:break-all;">${SITE_URL}/auth/verify-email?token=example-token</span></p>
    </div>`, 'dark'),
  },
  code: {
    label: '인증코드',
    light: emailLayout(`<div style="padding:40px 24px;background:white;">
      <h2 style="color:#1f2937;margin:0 0 20px 0;font-size:24px;">아이디 찾기 인증</h2>
      <p style="color:#6b7280;line-height:1.6;margin:0 0 20px 0;">아이디 찾기를 위한 인증코드를 발송해드립니다.</p>
      <div style="background:#f9fafb;border:2px solid #374151;border-radius:12px;padding:30px;margin:20px 0;text-align:center;">
        <p style="margin:0 0 10px 0;color:#6b7280;font-size:14px;">인증코드</p>
        <p style="margin:0;color:#1f2937;font-size:32px;font-weight:bold;letter-spacing:4px;font-family:'Courier New',monospace;">948271</p>
      </div>
      <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:15px;margin:20px 0;">
        <p style="margin:0;color:#92400e;font-size:14px;"><strong>유효시간:</strong> 이 인증코드는 5분간 유효합니다.<br><strong>보안:</strong> 이 코드를 다른 사람과 공유하지 마세요.</p>
      </div>
    </div>`),
    dark: emailLayout(`<div style="padding:40px 24px;background:#1D1D1D;">
      <h2 style="color:#F0F0F0;margin:0 0 20px 0;font-size:24px;">아이디 찾기 인증</h2>
      <p style="color:#CCCCCC;line-height:1.6;margin:0 0 20px 0;">아이디 찾기를 위한 인증코드를 발송해드립니다.</p>
      <div style="background:#2D2D2D;border:2px solid #F0F0F0;border-radius:12px;padding:30px;margin:20px 0;text-align:center;">
        <p style="margin:0 0 10px 0;color:#CCCCCC;font-size:14px;">인증코드</p>
        <p style="margin:0;color:#F0F0F0;font-size:32px;font-weight:bold;letter-spacing:4px;font-family:'Courier New',monospace;">948271</p>
      </div>
      <div style="background:#3D2E00;border:1px solid #7A5C00;border-radius:8px;padding:15px;margin:20px 0;">
        <p style="margin:0;color:#FCD34D;font-size:14px;"><strong style="color:#FDE68A;">유효시간:</strong> 이 인증코드는 5분간 유효합니다.<br><strong style="color:#FDE68A;">보안:</strong> 이 코드를 다른 사람과 공유하지 마세요.</p>
      </div>
    </div>`, 'dark'),
  },
};

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not available in production', { status: 403 });
  }

  const templatesJson = JSON.stringify(
    Object.fromEntries(
      Object.entries(templates).map(([key, val]) => [key, { label: val.label, light: val.light, dark: val.dark }])
    )
  );

  const tabButtons = Object.entries(templates)
    .map(([key, t]) => `<button class="tab" onclick="switchTab('${key}', this)">${t.label}</button>`)
    .join('');

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>이메일 템플릿 미리보기</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6}
    .header{background:#1f2937;color:white;padding:20px 32px}
    .header h1{font-size:18px;font-weight:600}
    .header p{color:#9ca3af;font-size:13px;margin-top:2px}
    .controls{display:flex;gap:8px;padding:12px 32px;background:white;border-bottom:1px solid #e5e7eb;flex-wrap:wrap;align-items:center}
    .tab{padding:7px 14px;border-radius:6px;border:1px solid #d1d5db;background:white;cursor:pointer;font-size:13px;color:#374151;transition:all .15s}
    .tab:hover{background:#f9fafb}
    .tab.active{background:#374151;color:white;border-color:#374151}
    .sep{width:1px;height:24px;background:#e5e7eb;margin:0 4px}
    .mode-btn{padding:7px 14px;border-radius:6px;border:1px solid #d1d5db;background:white;cursor:pointer;font-size:13px;color:#374151;transition:all .15s}
    .mode-btn:hover{background:#f9fafb}
    .mode-btn.active{background:#374151;color:white;border-color:#374151}
    .preview{max-width:700px;margin:24px auto;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)}
    .preview-label{padding:10px 20px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;display:flex;justify-content:space-between}
    .preview-content{min-height:400px;transition:background .2s}
    .preview-content.light{background:#e5e7eb;padding:20px}
    .preview-content.dark{background:#000;padding:20px}
  </style>
</head>
<body>
  <div class="header">
    <h1>이메일 템플릿 미리보기</h1>
    <p>4590 football - 로고 + 다크모드 대응</p>
  </div>
  <div class="controls">
    ${tabButtons}
    <div class="sep"></div>
    <button class="mode-btn active" onclick="switchMode('light', this)">Light</button>
    <button class="mode-btn" onclick="switchMode('dark', this)">Dark</button>
  </div>
  <div class="preview">
    <div class="preview-label"><span id="label"></span><span id="mode-label"></span></div>
    <div class="preview-content light" id="content"></div>
  </div>
  <script>
    var T = ${templatesJson};
    var currentType = 'password';
    var currentMode = 'light';
    function render() {
      document.getElementById('content').innerHTML = T[currentType][currentMode];
      document.getElementById('content').className = 'preview-content ' + currentMode;
      document.getElementById('label').textContent = T[currentType].label + ' 이메일';
      document.getElementById('mode-label').textContent = currentMode === 'light' ? 'Light Mode' : 'Dark Mode';
    }
    function switchTab(type, el) {
      currentType = type;
      document.querySelectorAll('.tab').forEach(function(t){ t.classList.remove('active'); });
      el.classList.add('active');
      render();
    }
    function switchMode(mode, el) {
      currentMode = mode;
      document.querySelectorAll('.mode-btn').forEach(function(t){ t.classList.remove('active'); });
      el.classList.add('active');
      render();
    }
    document.querySelector('.tab').classList.add('active');
    render();
  </script>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
