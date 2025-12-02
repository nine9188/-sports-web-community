const fs = require('fs');
const path = require('path');

/**
 * auth-guard와 suspension-guard를 새로운 authGuard로 마이그레이션하는 스크립트
 */

const srcDir = path.join(__dirname, 'src');

const files = [
  'src/domains/boards/actions/comments/create.ts',
  'src/domains/shop/actions/actions.ts',
  'src/domains/boards/actions/posts/likes.ts',
  'src/domains/boards/actions/posts/update.ts',
  'src/domains/boards/actions/posts/create.ts',
  'src/domains/boards/actions/comments/update.ts',
  'src/app/admin/shop/page.tsx',
  'src/app/settings/my-comments/page.tsx',
  'src/app/settings/profile/page.tsx',
];

function migrateFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // 1. Import 문 교체
  const oldImports = [
    /import\s+{\s*serverAuthGuard\s*}\s+from\s+['"]@\/shared\/utils\/auth-guard['"]/g,
    /import\s+{\s*checkSuspensionGuard\s*}\s+from\s+['"]@\/shared\/utils\/suspension-guard['"]/g,
    /import\s+{\s*suspensionGuard\s*}\s+from\s+['"]@\/shared\/utils\/suspension-guard['"]/g,
  ];

  oldImports.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, `import { authGuard } from '@/shared/guards/auth.guard'`);
      modified = true;
    }
  });

  // 2. serverAuthGuard 호출 패턴 교체 (간단한 케이스만)
  // const user = await serverAuthGuard() → const { user } = await authGuard()
  if (content.includes('await serverAuthGuard(')) {
    content = content.replace(
      /const\s+user\s*=\s*await\s+serverAuthGuard\(/g,
      'const { user } = await authGuard('
    );
    modified = true;
  }

  return { modified, content };
}

function main() {
  console.log('🔄 auth-guard 마이그레이션 시작...\n');

  const results = files.map(file => {
    const result = migrateFile(file);
    if (result.modified) {
      fs.writeFileSync(path.join(__dirname, file), result.content, 'utf8');
      console.log(`✅ ${file}`);
      return file;
    }
    return null;
  }).filter(Boolean);

  console.log(`\n✅ 마이그레이션 완료!`);
  console.log(`📊 수정된 파일: ${results.length}개`);

  if (results.length > 0) {
    console.log('\n⚠️  주의: 다음 파일들은 수동 확인이 필요할 수 있습니다:');
    console.log('- checkSuspensionGuard 로직이 복잡한 경우');
    console.log('- suspensionGuard를 사용하는 경우');
    console.log('\n각 파일을 확인하여 로직을 조정하세요.');
  }
}

main();
