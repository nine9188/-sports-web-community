#!/usr/bin/env node

/**
 * Supabase Import 경로 자동 마이그레이션 스크립트
 *
 * 기존:
 * - import { createClient } from '@/shared/api/supabase'
 * - import { createClient } from '@/shared/api/supabaseServer'
 * - import { createServerActionClient } from '@/shared/api/supabaseServer'
 * - import { createAdminClient } from '@/shared/api/supabaseServer'
 *
 * 새로운:
 * - import { getSupabaseBrowser } from '@/shared/lib/supabase'
 * - import { getSupabaseServer } from '@/shared/lib/supabase'
 * - import { getSupabaseAction } from '@/shared/lib/supabase'
 * - import { getSupabaseAdmin } from '@/shared/lib/supabase'
 */

const fs = require('fs');
const path = require('path');

// 마이그레이션 규칙
const migrations = [
  // 1. 클라이언트 컴포넌트 ('use client' 있는 파일)
  {
    filePattern: /\.tsx?$/,
    hasUseClient: true,
    find: /import\s*{\s*createClient\s*}\s*from\s*['"]@\/shared\/api\/supabase['"]/g,
    replace: "import { getSupabaseBrowser } from '@/shared/lib/supabase'",
    codeFind: /\bconst\s+(\w+)\s*=\s*createClient\(\)/g,
    codeReplace: 'const $1 = getSupabaseBrowser()',
  },

  // 2. 서버 컴포넌트/액션 - createClient (읽기 전용)
  {
    filePattern: /\.tsx?$/,
    hasUseClient: false,
    find: /import\s*{\s*createClient\s*}\s*from\s*['"]@\/shared\/api\/supabaseServer['"]/g,
    replace: "import { getSupabaseServer } from '@/shared/lib/supabase'",
    codeFind: /\bconst\s+(\w+)\s*=\s*await\s+createClient\(\)/g,
    codeReplace: 'const $1 = await getSupabaseServer()',
  },

  // 3. Server Action - createServerActionClient
  {
    filePattern: /\.tsx?$/,
    find: /import\s*{\s*createServerActionClient\s*}\s*from\s*['"]@\/shared\/api\/supabaseServer['"]/g,
    replace: "import { getSupabaseAction } from '@/shared/lib/supabase'",
    codeFind: /\bconst\s+(\w+)\s*=\s*await\s+createServerActionClient\(\)/g,
    codeReplace: 'const $1 = await getSupabaseAction()',
  },

  // 4. 관리자 클라이언트
  {
    filePattern: /\.tsx?$/,
    find: /import\s*{\s*createAdminClient\s*}\s*from\s*['"]@\/shared\/api\/supabaseServer['"]/g,
    replace: "import { getSupabaseAdmin } from '@/shared/lib/supabase'",
    codeFind: /\bconst\s+(\w+)\s*=\s*createAdminClient\(\)/g,
    codeReplace: 'const $1 = getSupabaseAdmin()',
  },

  // 5. 혼합 import 처리
  {
    filePattern: /\.tsx?$/,
    find: /import\s*{\s*createClient\s*,\s*createServerActionClient\s*}\s*from\s*['"]@\/shared\/api\/supabaseServer['"]/g,
    replace: "import { getSupabaseServer, getSupabaseAction } from '@/shared/lib/supabase'",
  },
];

// 파일 순회
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walkDir(filePath, callback);
      }
    } else {
      callback(filePath);
    }
  });
}

// 파일 마이그레이션
function migrateFile(filePath) {
  if (!/\.tsx?$/.test(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const hasUseClient = content.includes("'use client'") || content.includes('"use client"');

  migrations.forEach((rule) => {
    // filePattern 체크
    if (!rule.filePattern.test(filePath)) return;

    // use client 체크
    if (rule.hasUseClient !== undefined && rule.hasUseClient !== hasUseClient) return;

    // import 문 변경
    if (rule.find && content.match(rule.find)) {
      content = content.replace(rule.find, rule.replace);
      modified = true;
    }

    // 코드 변경
    if (rule.codeFind && content.match(rule.codeFind)) {
      content = content.replace(rule.codeFind, rule.codeReplace);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ 마이그레이션:', filePath.replace(process.cwd(), ''));
  }
}

// 실행
const srcDir = path.join(process.cwd(), 'src');
let count = 0;

console.log('🚀 Supabase import 마이그레이션 시작...\n');

walkDir(srcDir, (filePath) => {
  migrateFile(filePath);
  count++;
});

console.log(`\n✅ 완료! 총 ${count}개 파일 검사`);
console.log('\n다음 파일들은 수동으로 확인이 필요할 수 있습니다:');
console.log('- middleware.ts');
console.log('- app/auth/callback/route.ts');
console.log('- shared/context/AuthContext.tsx');
