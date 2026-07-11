const supabaseUrl = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuampmaHN1em94Y2xqcXF3d3Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjM1MzA3OSwiZXhwIjoyMDU3OTI5MDc5fQ.SJ99fRCa-s4hnXXm1IelWAUi5cb9Wre6uNcT7-5wb84';

async function main() {
  console.log('Querying boards...');
  const boardsRes = await fetch(`${supabaseUrl}/rest/v1/boards?select=id,name,slug`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  const boards = await boardsRes.json();
  const boardMap = {};
  boards.forEach(b => { boardMap[b.id] = b; });

  const isForeignFootballAllowed = (slug, name) => {
    const s = slug.toLowerCase();
    
    // Exclude noindex news boards
    if (s === 'news' || s === 'foreign-news' || s === 'domestic-news') return false;
    // Exclude domestic football
    if (s.includes('domestic') || s.includes('k-league')) return false;
    // Exclude world cup, notices, hotdeals, market, qna, humor, tips, free, review
    if (s.includes('world-cup') || s.includes('notice') || s.includes('hotdeal') || s.includes('market') || s.includes('qna') || s.includes('humor') || s.includes('tips') || s.includes('free') || s.includes('review')) return false;
    
    // Include foreign-analysis, clubs, leagues
    if (s.includes('foreign') || s.includes('analysis')) return true;
    
    const clubs = [
      'tottenham', 'liverpool', 'manchester-united', 'chelsea', 'arsenal', 'manchester-city',
      'real-madrid', 'barcelona', 'bayern-muenchen', 'aston-villa', 'brighton', 'brentford',
      'everton', 'wolves', 'west-ham', 'fulham', 'burnley', 'sunderland', 'inter', 'napoli',
      'juventus', 'atalanta', 'bologna', 'as-roma', 'fiorentina', 'torino', 'udinese', 'genoa',
      'como', 'verona', 'parma', 'lecce', 'cremonese', 'pisa', 'paris-fc', 'lorient', 'metz',
      '1899-hoffenheim', '1-fc-koeln', 'fc-st-pauli', 'hamburger-sv', '1-fc-heidenheim', 'crystal-palace'
    ];
    
    return clubs.some(c => s.includes(c));
  };

  console.log('Querying posts and contents...');
  const res = await fetch(`${supabaseUrl}/rest/v1/posts_content?select=post_id,content_text&limit=1000`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  const contentData = await res.json();

  const postIds = contentData.map(c => c.post_id);
  const postMap = {};
  const chunkSize = 200;
  for (let i = 0; i < postIds.length; i += chunkSize) {
    const chunk = postIds.slice(i, i + chunkSize);
    const postsRes = await fetch(`${supabaseUrl}/rest/v1/posts?id=in.(${chunk.join(',')})&select=id,post_number,title,board_id`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const postsData = await postsRes.json();
    postsData.forEach(p => { postMap[p.id] = p; });
  }

  const results = [];
  contentData.forEach(c => {
    const post = postMap[c.post_id];
    if (post) {
      const board = boardMap[post.board_id];
      // STRICTLY EXCLUDE title containing '예측'
      if (board && isForeignFootballAllowed(board.slug, board.name) && !post.title.includes('예측')) {
        results.push({
          post_number: post.post_number,
          title: post.title,
          board_name: board.name,
          board_slug: board.slug,
          text_length: (c.content_text || '').length,
          content_text: c.content_text || ''
        });
      }
    }
  });

  results.sort((a, b) => b.text_length - a.text_length);

  console.log(`\nFound ${results.length} allowed non-prediction posts.`);
  console.log('=== Longest Indexable Non-Prediction Posts (예측 제외 글씨 많은 글) ===');
  results.slice(0, 10).forEach((p, i) => {
    console.log(`\n[${i+1}] Title: ${p.title}`);
    console.log(`    URL: https://4590fb.com/boards/${p.board_slug}/${p.post_number}`);
    console.log(`    Board: ${p.board_name} (${p.board_slug})`);
    console.log(`    Length: ${p.text_length} characters`);
    console.log(`    Snippet: ${p.content_text.slice(0, 200).replace(/\n/g, ' ')}...`);
  });
}

main();
