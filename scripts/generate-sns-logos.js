const sharp = require('sharp');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const OUT = path.join(PUBLIC, 'sns');

const LOGO_BLACK = path.join(PUBLIC, 'logo', '4590football-logo.png');
const LOGO_WHITE = path.join(PUBLIC, 'logo', '4590football-logo-white.webp');
const ICON_WHITE = path.join(PUBLIC, 'logo', 'icon-04.png');

async function createBlackIcon(size) {
  return sharp(ICON_WHITE)
    .negate({ alpha: false })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
}

async function generateProfileSquare(name, size, bgColor, logoPath, isIcon) {
  const padding = Math.round(size * 0.15);
  const innerSize = size - padding * 2;

  let overlay;
  if (isIcon) {
    if (bgColor === '#000000') {
      overlay = await sharp(ICON_WHITE)
        .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();
    } else {
      overlay = await createBlackIcon(innerSize);
    }
  } else {
    overlay = await sharp(logoPath)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
  }

  const bg = bgColor === '#000000'
    ? { r: 0, g: 0, b: 0, alpha: 255 }
    : { r: 255, g: 255, b: 255, alpha: 255 };

  await sharp({
    create: { width: size, height: size, channels: 4, background: bg }
  })
    .composite([{ input: overlay, gravity: 'centre' }])
    .png()
    .toFile(path.join(OUT, name));

  console.log(`  ✓ ${name} (${size}x${size})`);
}

async function generateBanner(name, width, height, bgColor, logoPath) {
  const logoHeight = Math.round(height * 0.25);

  const overlay = await sharp(logoPath)
    .resize({ height: logoHeight, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const bg = bgColor === '#000000'
    ? { r: 0, g: 0, b: 0, alpha: 255 }
    : { r: 255, g: 255, b: 255, alpha: 255 };

  await sharp({
    create: { width, height, channels: 4, background: bg }
  })
    .composite([{ input: overlay, gravity: 'centre' }])
    .png()
    .toFile(path.join(OUT, name));

  console.log(`  ✓ ${name} (${width}x${height})`);
}

async function generateStory(name, width, height, bgColor, logoPath) {
  const logoHeight = Math.round(height * 0.12);

  const overlay = await sharp(logoPath)
    .resize({ height: logoHeight, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const bg = bgColor === '#000000'
    ? { r: 0, g: 0, b: 0, alpha: 255 }
    : { r: 255, g: 255, b: 255, alpha: 255 };

  await sharp({
    create: { width, height, channels: 4, background: bg }
  })
    .composite([{ input: overlay, gravity: 'centre' }])
    .png()
    .toFile(path.join(OUT, name));

  console.log(`  ✓ ${name} (${width}x${height})`);
}

async function generateThumbnailTemplate(name, width, height, bgColor, logoPath) {
  const logoHeight = Math.round(height * 0.15);

  const overlay = await sharp(logoPath)
    .resize({ height: logoHeight, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const bg = bgColor === '#000000'
    ? { r: 0, g: 0, b: 0, alpha: 255 }
    : { r: 255, g: 255, b: 255, alpha: 255 };

  const padding = Math.round(width * 0.03);

  await sharp({
    create: { width, height, channels: 4, background: bg }
  })
    .composite([{
      input: overlay,
      gravity: 'southeast',
      top: height - logoHeight - padding,
      left: width - Math.round(logoHeight * 2.3) - padding,
    }])
    .png()
    .toFile(path.join(OUT, name));

  console.log(`  ✓ ${name} (${width}x${height})`);
}

async function main() {
  console.log('\n📱 Instagram 프로필 (320x320, 원형 크롭됨)');
  await generateProfileSquare('ig-profile-black-bg.png', 320, '#000000', null, true);
  await generateProfileSquare('ig-profile-white-bg.png', 320, '#FFFFFF', null, true);

  console.log('\n📱 Instagram 프로필 HD (800x800)');
  await generateProfileSquare('ig-profile-black-bg-hd.png', 800, '#000000', null, true);
  await generateProfileSquare('ig-profile-white-bg-hd.png', 800, '#FFFFFF', null, true);

  console.log('\n📸 Instagram 게시물 (1080x1080)');
  await generateProfileSquare('ig-post-black-bg.png', 1080, '#000000', LOGO_WHITE, false);
  await generateProfileSquare('ig-post-white-bg.png', 1080, '#FFFFFF', LOGO_BLACK, false);

  console.log('\n📖 Instagram 스토리/릴스 (1080x1920)');
  await generateStory('ig-story-black-bg.png', 1080, 1920, '#000000', LOGO_WHITE);
  await generateStory('ig-story-white-bg.png', 1080, 1920, '#FFFFFF', LOGO_BLACK);

  console.log('\n🎬 YouTube 프로필 (800x800, 원형 크롭됨)');
  await generateProfileSquare('yt-profile-black-bg.png', 800, '#000000', null, true);
  await generateProfileSquare('yt-profile-white-bg.png', 800, '#FFFFFF', null, true);

  console.log('\n🖼️  YouTube 채널 배너 (2560x1440)');
  await generateBanner('yt-banner-black-bg.png', 2560, 1440, '#000000', LOGO_WHITE);
  await generateBanner('yt-banner-white-bg.png', 2560, 1440, '#FFFFFF', LOGO_BLACK);

  console.log('\n🎞️  YouTube 썸네일 템플릿 (1280x720)');
  await generateThumbnailTemplate('yt-thumbnail-black-bg.png', 1280, 720, '#000000', LOGO_WHITE);
  await generateThumbnailTemplate('yt-thumbnail-white-bg.png', 1280, 720, '#FFFFFF', LOGO_BLACK);

  console.log('\n✅ 완료! public/sns/ 디렉토리에 생성됨\n');
}

main().catch(console.error);
