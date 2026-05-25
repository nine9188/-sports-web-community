#!/usr/bin/env node

require('dotenv').config({ path: '.env.local', quiet: true });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const shouldApply = process.argv.includes('--apply');
const includeInactive = process.argv.includes('--include-inactive');
const targetArg = process.argv.find((arg) => arg.startsWith('--target='));
const target = targetArg ? targetArg.split('=')[1] : 'non-ascii';

const transliterations = {
  Æ: 'AE',
  æ: 'ae',
  Ð: 'D',
  ð: 'd',
  Đ: 'D',
  đ: 'd',
  Þ: 'Th',
  þ: 'th',
  Ł: 'L',
  ł: 'l',
  Ø: 'O',
  ø: 'o',
  Œ: 'OE',
  œ: 'oe',
  ß: 'ss',
  Ŋ: 'N',
  ŋ: 'n',
};

function slugify(text) {
  return String(text || '')
    .replace(/[ıİ]/g, 'i')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[şŞ]/g, 's')
    .replace(/[çÇ]/g, 'c')
    .replace(/[öÖ]/g, 'o')
    .replace(/[üÜ]/g, 'u')
    .replace(/[ÆæðÐĐđÞþŁłØøŒœßŊŋ]/g, (char) => transliterations[char] || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    .replace(/[^a-zA-Z0-9_\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function hasNonAscii(text) {
  return /[^\x00-\x7F]/.test(String(text || ''));
}

function hasInvalidSlugChars(slug) {
  return !/^[a-z0-9_-]+$/.test(String(slug || ''));
}

function hasSuspectedMojibake(text) {
  return /(?:Ã|Å|Â|�)/.test(String(text || ''));
}

async function fetchPlayers() {
  const rows = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    let query = supabase
      .from('football_players')
      .select('player_id,name,display_name,korean_name,slug,is_active,updated_at')
      .order('player_id', { ascending: true })
      .range(from, to);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

async function main() {
  const rows = await fetchPlayers();
  const mismatches = rows
    .map((row) => {
      const source = row.name || row.display_name || '';
      const expectedSlug = slugify(source);
      const currentSlug = row.slug || '';

      return {
        player_id: row.player_id,
        name: row.name,
        korean_name: row.korean_name,
        current_slug: currentSlug,
        expected_slug: expectedSlug,
        non_ascii_name: hasNonAscii(source),
        invalid_slug_chars: hasInvalidSlugChars(currentSlug),
        suspected_mojibake: hasSuspectedMojibake(source),
        updated_at: row.updated_at,
      };
    })
    .filter((row) => row.expected_slug && row.current_slug !== row.expected_slug);

  const invalidSlugRows = rows.filter((row) => hasInvalidSlugChars(row.slug));
  const nonAsciiNameMismatches = mismatches.filter((row) => row.non_ascii_name);
  const targetCandidates = target === 'all' ? mismatches : nonAsciiNameMismatches;
  const updateCandidates = targetCandidates.filter((row) => !row.suspected_mojibake);
  const skippedCandidates = targetCandidates.filter((row) => row.suspected_mojibake);

  if (shouldApply) {
    for (const row of updateCandidates) {
      const { error } = await supabase
        .from('football_players')
        .update({ slug: row.expected_slug })
        .eq('player_id', row.player_id);

      if (error) {
        throw new Error(`Failed to update player ${row.player_id}: ${error.message}`);
      }
    }
  }

  console.log(JSON.stringify({
    mode: shouldApply ? 'apply' : 'dry-run',
    target,
    scope: includeInactive ? 'all' : 'active',
    row_total: rows.length,
    mismatch_total: mismatches.length,
    non_ascii_name_mismatch_total: nonAsciiNameMismatches.length,
    invalid_slug_total: invalidSlugRows.length,
    skipped_suspected_mojibake_total: skippedCandidates.length,
    update_candidate_total: updateCandidates.length,
    updated_total: shouldApply ? updateCandidates.length : 0,
    samples: updateCandidates.slice(0, 80),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
