/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * 다크모드 리그 로고 WebP 멀티사이즈 변환 스크립트
 *
 * 기존 Storage의 `leagues/{id}-1.png` 파일을 다운로드하여
 * sharp로 3사이즈 WebP 변환 후 `leagues/{size}/{id}-1.webp`로 업로드
 *
 * 실행:
 *   npx tsx scripts/convert-dark-league-logos.ts
 */

export {};

(async function () {
  const { createClient } = require('@supabase/supabase-js');
  const dotenv = require('dotenv');
  const sharp = require('sharp');

  dotenv.config({ path: '.env.local' });

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ 환경 변수가 설정되지 않았습니다 (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const BUCKET = 'leagues';
  const DARK_MODE_LEAGUE_IDS = [2, 3, 13, 39, 61, 66, 88, 98, 119, 179, 292, 848];

  const SIZE_CONFIG: Record<string, number> = {
    sm: 64,
    md: 128,
    lg: 256,
  };

  const SIZES = ['sm', 'md', 'lg'] as const;

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const leagueId of DARK_MODE_LEAGUE_IDS) {
    const sourcePath = `${leagueId}-1.png`;

    try {
      // 1. 기존 PNG 다운로드
      console.log(`\n[${leagueId}] 다운로드 중: ${BUCKET}/${sourcePath}`);

      const { data: fileData, error: downloadError } = await supabase.storage
        .from(BUCKET)
        .download(sourcePath);

      if (downloadError || !fileData) {
        console.warn(`  ⚠️  파일 없음, 건너뜀: ${sourcePath} (${downloadError?.message})`);
        skipCount++;
        continue;
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`  다운로드 완료: ${(buffer.byteLength / 1024).toFixed(1)}KB`);

      // 2. 3사이즈 WebP 변환 및 업로드
      for (const size of SIZES) {
        const maxDim = SIZE_CONFIG[size];
        const destPath = `${size}/${leagueId}-1.webp`;

        const webpBuffer = await sharp(buffer)
          .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(destPath, webpBuffer, {
            contentType: 'image/webp',
            upsert: true,
          });

        if (uploadError) {
          console.error(`  ❌ 업로드 실패: ${destPath} - ${uploadError.message}`);
          errorCount++;
        } else {
          console.log(`  ✅ ${destPath} (${maxDim}px, ${(webpBuffer.byteLength / 1024).toFixed(1)}KB)`);
        }
      }

      successCount++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ 처리 실패 [${leagueId}]: ${msg}`);
      errorCount++;
    }
  }

  console.log('\n========================================');
  console.log(`완료! 성공: ${successCount}, 건너뜀: ${skipCount}, 에러: ${errorCount}`);
  console.log('========================================');
})();
