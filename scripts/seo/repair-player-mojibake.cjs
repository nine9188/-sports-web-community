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

function hasMojibakeSequence(text) {
  return /(?:Ã[\u0080-\u00BF]|Å[\u0080-\u00BF]|Â[\u0080-\u00BF])/.test(String(text || ''));
}

function decodeMojibakeSequences(text) {
  return String(text || '')
    .replace(/(?:Ã[\u0080-\u00BF]|Å[\u0080-\u00BF]|Â[\u0080-\u00BF])/g, (sequence) => {
      const decoded = Buffer.from(sequence, 'latin1').toString('utf8');
      return decoded.includes('\uFFFD') ? sequence : decoded;
    })
    .replace(/\u00AD/g, '');
}

async function fetchPlayers() {
  const rows = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('football_players')
      .select('player_id,name,display_name,korean_name,slug,is_active,updated_at')
      .order('player_id', { ascending: true })
      .range(from, to);

    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

async function main() {
  const rows = await fetchPlayers();
  const candidates = rows
    .filter((row) => hasMojibakeSequence(row.name))
    .map((row) => {
      const correctedName = decodeMojibakeSequences(row.name);
      const correctedDisplayName = row.display_name === row.name
        ? correctedName
        : decodeMojibakeSequences(row.display_name || row.name);
      const correctedSlug = slugify(correctedName);

      return {
        player_id: row.player_id,
        is_active: row.is_active,
        current_name: row.name,
        corrected_name: correctedName,
        current_display_name: row.display_name,
        corrected_display_name: correctedDisplayName,
        current_slug: row.slug,
        corrected_slug: correctedSlug,
        updated_at: row.updated_at,
      };
    })
    .filter((row) => row.corrected_name !== row.current_name || row.corrected_slug !== row.current_slug);

  if (shouldApply) {
    for (const row of candidates) {
      const { error } = await supabase
        .from('football_players')
        .update({
          name: row.corrected_name,
          display_name: row.corrected_display_name,
          slug: row.corrected_slug,
        })
        .eq('player_id', row.player_id);

      if (error) {
        throw new Error(`Failed to update player ${row.player_id}: ${error.message}`);
      }
    }
  }

  console.log(JSON.stringify({
    mode: shouldApply ? 'apply' : 'dry-run',
    row_total: rows.length,
    candidate_total: candidates.length,
    updated_total: shouldApply ? candidates.length : 0,
    samples: candidates.slice(0, 80),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
