const supabaseUrl = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuampmaHN1em94Y2xqcXF3d3Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjM1MzA3OSwiZXhwIjoyMDU3OTI5MDc5fQ.SJ99fRCa-s4hnXXm1IelWAUi5cb9Wre6uNcT7-5wb84';

async function checkBoards() {
  const url = `${supabaseUrl}/rest/v1/boards?select=id,name,slug`;
  const res = await fetch(url, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  if (res.ok) {
    console.log('Boards:', await res.json());
  } else {
    console.error('Failed:', res.status, await res.text());
  }
}

checkBoards();
