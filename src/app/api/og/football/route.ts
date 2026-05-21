import sharp from 'sharp';

export const runtime = 'nodejs';

const SIZE = {
  width: 1200,
  height: 630,
} as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = clamp(searchParams.get('title') || '4590 Football', 90);
  const subtitle = clamp(searchParams.get('subtitle') || '', 110);
  const label = clamp(searchParams.get('label') || '4590 Football', 32);
  const leftImage = getSafeImageUrl(searchParams.get('leftImage'));
  const rightImage = getSafeImageUrl(searchParams.get('rightImage'));

  const [leftDataUri, rightDataUri] = await Promise.all([
    imageToDataUri(leftImage),
    imageToDataUri(rightImage),
  ]);

  const svg = renderOgSvg({
    title,
    subtitle,
    label,
    leftImage: leftDataUri,
    rightImage: rightDataUri,
  });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(new Uint8Array(png), {
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800',
    },
  });
}

function renderOgSvg({
  title,
  subtitle,
  label,
  leftImage,
  rightImage,
}: {
  title: string;
  subtitle: string;
  label: string;
  leftImage: string | null;
  rightImage: string | null;
}) {
  const titleLines = wrapText(title, 18, 2);
  const subtitleLines = wrapText(subtitle, 34, 2);
  const titleStartY = titleLines.length > 1 ? 270 : 310;
  const imageSlotsWidth = (leftImage ? 216 : 0) + (rightImage ? 216 : 0);
  const textX = leftImage ? 298 : 80;
  const textWidth = 1040 - imageSlotsWidth;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SIZE.width}" height="${SIZE.height}" viewBox="0 0 ${SIZE.width} ${SIZE.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${SIZE.width}" height="${SIZE.height}" fill="#101828"/>
  <rect x="0" y="0" width="${SIZE.width}" height="${SIZE.height}" fill="url(#g)"/>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="${SIZE.width}" y2="${SIZE.height}" gradientUnits="userSpaceOnUse">
      <stop stop-color="#111827"/>
      <stop offset="0.55" stop-color="#182230"/>
      <stop offset="1" stop-color="#0B4A6F"/>
    </linearGradient>
  </defs>

  <rect x="64" y="58" width="46" height="46" rx="12" fill="#FFFFFF"/>
  <text x="87" y="89" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="900" fill="#101828">4590</text>
  <text x="128" y="91" font-family="Arial, 'Noto Sans CJK KR', sans-serif" font-size="30" font-weight="800" fill="#FFFFFF">${escapeXml(label)}</text>

  ${renderImageSlot(leftImage, 80, 226)}
  <g transform="translate(${textX}, 0)">
    ${titleLines.map((line, index) => `<text x="0" y="${titleStartY + index * 76}" font-family="Arial, 'Noto Sans CJK KR', sans-serif" font-size="66" font-weight="900" fill="#FFFFFF">${escapeXml(line)}</text>`).join('')}
    ${subtitleLines.map((line, index) => `<text x="0" y="${titleStartY + titleLines.length * 76 + 20 + index * 42}" font-family="Arial, 'Noto Sans CJK KR', sans-serif" font-size="32" font-weight="500" fill="#D0D5DD">${escapeXml(line)}</text>`).join('')}
  </g>
  ${renderImageSlot(rightImage, Math.min(952, textX + textWidth + 28), 226)}

  <text x="64" y="548" font-family="Arial, 'Noto Sans CJK KR', sans-serif" font-size="26" font-weight="500" fill="#D0D5DD">축구 라이브스코어 &amp; 커뮤니티</text>
  <text x="1136" y="548" text-anchor="end" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="#FFFFFF">4590football.com</text>
</svg>`;
}

function renderImageSlot(src: string | null, x: number, y: number): string {
  if (!src) return '';
  return `
  <rect x="${x}" y="${y}" width="168" height="168" rx="34" fill="#FFFFFF"/>
  <image x="${x + 22}" y="${y + 22}" width="124" height="124" preserveAspectRatio="xMidYMid meet" href="${src}"/>`;
}

function wrapText(value: string, maxChars: number, maxLines: number): string[] {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines) break;
  }

  if (current && lines.length < maxLines) lines.push(current);
  const overflow = words.join(' ').length > lines.join(' ').length;
  if (overflow && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, Math.max(1, maxChars - 1)).trim()}…`;
  }

  return lines;
}

function clamp(value: string, maxLength: number): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trim()}…`;
}

function getSafeImageUrl(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return null;
}

async function imageToDataUri(url: string | null): Promise<string | null> {
  if (!url) return null;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) return null;

    const input = Buffer.from(await response.arrayBuffer());
    const image = await sharp(input)
      .resize(124, 124, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toBuffer();

    return `data:image/png;base64,${image.toString('base64')}`;
  } catch {
    return null;
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
