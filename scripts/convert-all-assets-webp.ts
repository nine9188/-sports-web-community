/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * 기존 Storage PNG 원본 → 멀티사이즈 WebP 일괄 변환 스크립트
 *
 * Storage 루트에 있는 {id}.png 파일을 다운로드하여
 * sharp로 sm/md/lg WebP 변환 후 {size}/{id}.webp로 업로드,
 * asset_cache도 ready로 업데이트
 *
 * 실행:
 *   npx tsx scripts/convert-all-assets-webp.ts
 *
 * 특정 버킷만:
 *   npx tsx scripts/convert-all-assets-webp.ts teams
 *   npx tsx scripts/convert-all-assets-webp.ts players
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
    console.error('❌ 환경 변수 없음 (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // 버킷 → asset_cache type 매핑
  const BUCKET_TYPE_MAP: Record<string, string> = {
    teams: 'team_logo',
    leagues: 'league_logo',
    players: 'player_photo',
    coachs: 'coach_photo',
    venues: 'venue_photo',
  };

  const SIZE_CONFIG: Record<string, number> = {
    sm: 64,
    md: 128,
    lg: 256,
  };

  const VENUE_SIZE_CONFIG: Record<string, number> = {
    sm: 128,
    md: 256,
    lg: 512,
  };

  const SIZES = ['sm', 'md', 'lg'] as const;
  const BATCH_SIZE = 10; // 동시 처리 수
  const LIST_LIMIT = 1000; // Supabase list API 한도

  // CLI 인자로 특정 버킷만 지정 가능
  const targetBucket = process.argv[2];
  const buckets = targetBucket
    ? [targetBucket]
    : ['teams', 'leagues', 'players', 'coachs', 'venues'];

  for (const bucket of buckets) {
    const assetType = BUCKET_TYPE_MAP[bucket];
    if (!assetType) {
      console.error(`❌ 알 수 없는 버킷: ${bucket}`);
      continue;
    }

    const sizeConfig = bucket === 'venues' ? VENUE_SIZE_CONFIG : SIZE_CONFIG;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 버킷: ${bucket} (type: ${assetType})`);
    console.log(`${'='.repeat(60)}`);

    // Storage에서 루트의 PNG 파일 목록 가져오기 (페이지네이션)
    let allFiles: string[] = [];
    let offset = 0;

    while (true) {
      const { data: files, error: listError } = await supabase.storage
        .from(bucket)
        .list('', { limit: LIST_LIMIT, offset, sortBy: { column: 'name', order: 'asc' } });

      if (listError) {
        console.error(`  ❌ 파일 목록 조회 실패: ${listError.message}`);
        break;
      }

      if (!files || files.length === 0) break;

      // 루트의 .png 파일만 (폴더 제외)
      const pngFiles = files
        .filter((f: { name: string; id: string | null }) => f.name.endsWith('.png') && f.id)
        .map((f: { name: string }) => f.name);

      allFiles.push(...pngFiles);

      if (files.length < LIST_LIMIT) break;
      offset += LIST_LIMIT;
    }

    console.log(`  총 ${allFiles.length}개 PNG 파일 발견\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // 이미 변환된 파일 체크 (sm 폴더에 webp가 있으면 스킵)
    const { data: existingFiles } = await supabase.storage
      .from(bucket)
      .list('md', { limit: LIST_LIMIT * 10, sortBy: { column: 'name', order: 'asc' } });

    const existingSet = new Set<string>();
    if (existingFiles) {
      for (const f of existingFiles) {
        // "33.webp" → "33"
        const match = f.name.match(/^(\d+)\.webp$/);
        if (match) existingSet.add(match[1]);
      }
    }

    // 배치 처리
    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (fileName: string) => {
          // "33.png" → entityId = 33
          const match = fileName.match(/^(\d+)\.png$/);
          if (!match) {
            // 다크모드 파일 등 숫자가 아닌 파일은 스킵 (별도 스크립트로 처리)
            return 'skip';
          }

          const entityId = match[1];

          // 이미 변환 완료된 파일 스킵
          if (existingSet.has(entityId)) {
            return 'skip';
          }

          // 1. Storage에서 원본 다운로드
          const { data: fileData, error: dlError } = await supabase.storage
            .from(bucket)
            .download(fileName);

          if (dlError || !fileData) {
            throw new Error(`다운로드 실패: ${fileName} - ${dlError?.message}`);
          }

          const buffer = Buffer.from(await fileData.arrayBuffer());

          // 2. 3사이즈 WebP 변환 및 업로드
          for (const size of SIZES) {
            const maxDim = sizeConfig[size];
            const destPath = `${size}/${entityId}.webp`;

            const webpBuffer = await sharp(buffer)
              .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
              .webp({ quality: 80 })
              .toBuffer();

            const { error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(destPath, webpBuffer, {
                contentType: 'image/webp',
                upsert: true,
              });

            if (uploadError) {
              throw new Error(`업로드 실패: ${destPath} - ${uploadError.message}`);
            }
          }

          // 3. asset_cache upsert (ready)
          await supabase
            .from('asset_cache')
            .upsert(
              {
                type: assetType,
                entity_id: parseInt(entityId),
                storage_path: `md/${entityId}.webp`,
                source_url: `https://media.api-sports.io/football/${bucket === 'coachs' ? 'coachs' : bucket}/${entityId}.png`,
                status: 'ready',
                checked_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'type,entity_id' }
            );

          return 'success';
        })
      );

      // 결과 집계
      for (const r of results) {
        if (r.status === 'fulfilled') {
          if (r.value === 'skip') skipCount++;
          else successCount++;
        } else {
          errorCount++;
          console.error(`  ❌ ${r.reason}`);
        }
      }

      // 진행률 표시
      const done = Math.min(i + BATCH_SIZE, allFiles.length);
      const pct = ((done / allFiles.length) * 100).toFixed(1);
      process.stdout.write(`\r  진행: ${done}/${allFiles.length} (${pct}%) | 성공: ${successCount} 스킵: ${skipCount} 에러: ${errorCount}`);
    }

    console.log(`\n  ✅ ${bucket} 완료 - 성공: ${successCount}, 스킵: ${skipCount}, 에러: ${errorCount}`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎉 전체 변환 완료!');
  console.log(`${'='.repeat(60)}`);
})();
