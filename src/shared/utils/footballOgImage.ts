import { siteConfig } from '@/shared/config';

type FootballOgImageParams = {
  title: string;
  subtitle?: string;
  label?: string;
  leftImage?: string | null;
  rightImage?: string | null;
};

export function buildFootballOgImageUrl({
  title,
  subtitle,
  label,
  leftImage,
  rightImage,
}: FootballOgImageParams): string {
  const params = new URLSearchParams();
  params.set('title', title);
  if (subtitle) params.set('subtitle', subtitle);
  if (label) params.set('label', label);
  if (leftImage) params.set('leftImage', leftImage);
  if (rightImage) params.set('rightImage', rightImage);

  return `${siteConfig.url}/api/og/football?${params.toString()}`;
}
