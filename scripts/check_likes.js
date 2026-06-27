const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const postNumber = 6552;
  
  // Query posts table by post_number
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('*')
    .eq('post_number', postNumber)
    .single();
    
  if (postError) {
    console.error('Post fetch error:', postError);
    return;
  }
  
  console.log('Post details:');
  console.log(JSON.stringify({
    id: post.id,
    post_number: post.post_number,
    title: post.title,
    likes: post.likes,
    views: post.views,
    created_at: post.created_at
  }, null, 2));
  
  // Query post_likes count by post_id (UUID)
  const { count, error: likesError } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post.id);
    
  if (likesError) {
    console.error('Likes fetch error:', likesError);
  } else {
    console.log('\nActual likes row count in post_likes for this post:', count);
  }
}

main();
