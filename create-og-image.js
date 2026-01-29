const fs = require('fs');
const path = require('path');

// Sharp 없이 간단하게 SVG로 생성
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <!-- 흰색 배경 -->
  <rect width="1200" height="630" fill="white"/>
  
  <!-- 로고 이미지 (중앙 배치) -->
  <image href="logo/4590football-logo.png" 
         x="300" y="165" 
         width="600" height="300" 
         preserveAspectRatio="xMidYMid meet"/>
  
  <!-- 부제 -->
  <text x="600" y="520" 
        font-family="Arial, sans-serif" 
        font-size="32" 
        fill="#333" 
        text-anchor="middle">
    실시간 축구 스코어 &amp; 커뮤니티
  </text>
</svg>`;

fs.writeFileSync(path.join(__dirname, 'public', 'og-image.svg'), svgContent);
console.log('✅ Created og-image.svg');
