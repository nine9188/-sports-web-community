const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fetchAll(tableName, selectQuery = '*') {
  let allData = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    console.log(`Fetching ${tableName} page ${page + 1}...`);
    const { data, error } = await supabase
      .from(tableName)
      .select(selectQuery)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      throw error;
    }
    if (!data || data.length === 0) {
      break;
    }
    allData = allData.concat(data);
    if (data.length < pageSize) {
      break;
    }
    page++;
  }
  return allData;
}

async function main() {
  try {
    console.log('Fetching profiles...');
    const profiles = await fetchAll('profiles', 'id, nickname, username, email, exp, level, points');
    
    console.log('Fetching posts...');
    const posts = await fetchAll('posts', 'user_id');
    
    console.log('Fetching comments...');
    const comments = await fetchAll('comments', 'user_id');

    console.log(`Summary: ${profiles.length} profiles, ${posts.length} posts, ${comments.length} comments fetched.`);

    // Map profile ID to object for quick lookup
    const profileMap = new Map();
    profiles.forEach(p => {
      profileMap.set(p.id, {
        id: p.id,
        nickname: p.nickname || 'N/A',
        username: p.username || 'N/A',
        email: p.email || 'N/A',
        exp: p.exp || 0,
        level: p.level || 0,
        points: p.points || 0,
        postCount: 0,
        commentCount: 0,
        totalActivity: 0
      });
    });

    // Aggregate posts
    posts.forEach(post => {
      if (post.user_id && profileMap.has(post.user_id)) {
        const user = profileMap.get(post.user_id);
        user.postCount++;
      }
    });

    // Aggregate comments
    comments.forEach(comment => {
      if (comment.user_id && profileMap.has(comment.user_id)) {
        const user = profileMap.get(comment.user_id);
        user.commentCount++;
      }
    });

    // Calculate total activity and collect users
    const usersList = [];
    profileMap.forEach(user => {
      user.totalActivity = user.postCount + user.commentCount;
      usersList.push(user);
    });

    // Sort by Total Activity desc
    const sortedByTotal = [...usersList].sort((a, b) => b.totalActivity - a.totalActivity || b.postCount - a.postCount);
    // Sort by Posts desc
    const sortedByPosts = [...usersList].sort((a, b) => b.postCount - a.postCount || b.commentCount - a.commentCount);
    // Sort by Comments desc
    const sortedByComments = [...usersList].sort((a, b) => b.commentCount - a.commentCount || b.postCount - a.postCount);

    // Build the Markdown Content
    let markdown = `# 🏆 회원 활동 순위 리포트\n\n`;
    markdown += `*데이터 추출 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}*\n\n`;
    markdown += `본 리포트는 Supabase 데이터베이스 내 \`profiles\`, \`posts\`, \`comments\` 테이블을 분석하여 회원들의 활동 순위를 나열한 결과입니다.\n\n`;
    
    markdown += `## 📊 요약 통계\n`;
    markdown += `- **총 회원 수:** ${profiles.length}명\n`;
    markdown += `- **총 게시글 수:** ${posts.length}개\n`;
    markdown += `- **총 댓글 수:** ${comments.length}개\n\n`;

    markdown += `## 1. 종합 활동 순위 (게시글 + 댓글 수 기준)\n`;
    markdown += `종합 활동 점수는 작성한 게시글 수와 댓글 수의 합산으로 계산되었습니다.\n\n`;
    markdown += `| 순위 | 닉네임 (아이디) | 게시글 수 | 댓글 수 | 종합 활동 점수 | 레벨 (경험치) | 포인트 |\n`;
    markdown += `| :---: | :--- | :---: | :---: | :---: | :---: | :---: |\n`;
    
    sortedByTotal.slice(0, 100).forEach((user, index) => {
      const displayName = `${user.nickname} (${user.username})`;
      markdown += `| ${index + 1} | ${displayName} | ${user.postCount} | ${user.commentCount} | **${user.totalActivity}** | Lv.${user.level} (${user.exp}) | ${user.points.toLocaleString()} |\n`;
    });
    
    if (sortedByTotal.length > 100) {
      markdown += `| ... | ... | ... | ... | ... | ... | ... |\n`;
    }

    markdown += `\n## 2. 게시글 작성 순위\n`;
    markdown += `작성한 게시글이 가장 많은 회원 순위입니다.\n\n`;
    markdown += `| 순위 | 닉네임 (아이디) | 게시글 수 | 댓글 수 | 종합 활동 점수 | 레벨 (경험치) | 포인트 |\n`;
    markdown += `| :---: | :--- | :---: | :---: | :---: | :---: | :---: |\n`;
    
    sortedByPosts.slice(0, 50).forEach((user, index) => {
      const displayName = `${user.nickname} (${user.username})`;
      markdown += `| ${index + 1} | ${displayName} | **${user.postCount}** | ${user.commentCount} | ${user.totalActivity} | Lv.${user.level} (${user.exp}) | ${user.points.toLocaleString()} |\n`;
    });

    if (sortedByPosts.length > 50) {
      markdown += `| ... | ... | ... | ... | ... | ... | ... |\n`;
    }

    markdown += `\n## 3. 댓글 작성 순위\n`;
    markdown += `작성한 댓글이 가장 많은 회원 순위입니다.\n\n`;
    markdown += `| 순위 | 닉네임 (아이디) | 댓글 수 | 게시글 수 | 종합 활동 점수 | 레벨 (경험치) | 포인트 |\n`;
    markdown += `| :---: | :--- | :---: | :---: | :---: | :---: | :---: |\n`;
    
    sortedByComments.slice(0, 50).forEach((user, index) => {
      const displayName = `${user.nickname} (${user.username})`;
      markdown += `| ${index + 1} | ${displayName} | **${user.commentCount}** | ${user.postCount} | ${user.totalActivity} | Lv.${user.level} (${user.exp}) | ${user.points.toLocaleString()} |\n`;
    });

    if (sortedByComments.length > 50) {
      markdown += `| ... | ... | ... | ... | ... | ... | ... |\n`;
    }

    const outputPath = path.resolve(__dirname, '../.gemini/here/member_activity_rankings.md');
    fs.writeFileSync(outputPath, markdown, 'utf8');
    console.log(`Report successfully written to ${outputPath}`);
  } catch (error) {
    console.error('Fatal error in main:', error);
  }
}

main();
