const fs = require('fs');
const path = require('path');

/**
 * 서버 전용 import를 /server로 마이그레이션하는 스크립트
 *
 * Before: import { getSupabaseServer } from '@/shared/lib/supabase'
 * After:  import { getSupabaseServer } from '@/shared/lib/supabase/server'
 */

const srcDir = path.join(__dirname, 'src');

// 서버 전용 함수들
const serverFunctions = [
  'getSupabaseServer',
  'getSupabaseAction',
  'getSupabaseRouteHandler',
  'getSupabaseAdmin'
];

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 서버 함수 import 패턴 찾기
  const importPattern = /import\s+{([^}]+)}\s+from\s+['"]@\/shared\/lib\/supabase['"]/g;

  const matches = [...content.matchAll(importPattern)];

  for (const match of matches) {
    const fullMatch = match[0];
    const imports = match[1].split(',').map(i => i.trim());

    const serverImports = imports.filter(imp =>
      serverFunctions.some(fn => imp.includes(fn))
    );

    const clientImports = imports.filter(imp =>
      !serverFunctions.some(fn => imp.includes(fn)) && !imp.startsWith('type ')
    );

    const typeImports = imports.filter(imp => imp.startsWith('type '));

    if (serverImports.length > 0) {
      // 서버 import가 있으면 분리
      let replacement = '';

      // 클라이언트 import (있는 경우)
      if (clientImports.length > 0 || typeImports.length > 0) {
        const allClientImports = [...clientImports, ...typeImports].join(', ');
        replacement += `import { ${allClientImports} } from '@/shared/lib/supabase'\n`;
      }

      // 서버 import
      const allServerImports = serverImports.join(', ');
      replacement += `import { ${allServerImports} } from '@/shared/lib/supabase/server'`;

      content = content.replace(fullMatch, replacement);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

function main() {
  console.log('🔄 서버 import 마이그레이션 시작...\n');

  const allFiles = getAllFiles(srcDir);
  let modifiedCount = 0;
  const modifiedFiles = [];

  for (const filePath of allFiles) {
    if (migrateFile(filePath)) {
      modifiedCount++;
      modifiedFiles.push(path.relative(srcDir, filePath));
    }
  }

  console.log(`✅ 마이그레이션 완료!`);
  console.log(`📊 수정된 파일: ${modifiedCount}개\n`);

  if (modifiedFiles.length > 0) {
    console.log('수정된 파일 목록:');
    modifiedFiles.forEach(file => console.log(`  - ${file}`));
  }
}

main();
