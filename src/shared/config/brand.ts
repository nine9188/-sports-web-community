export const brandColors = {
  primary: '#002FA7',
  primaryDark: '#3366CC',
  hover: '#001F78',
  hoverDark: '#0038C8',
  soft: '#E6EAFB',
  softDark: 'rgba(0,47,167,0.2)',
  softText: '#001F78',
  softTextDark: '#6690DD',
} as const;

export type BrandColors = typeof brandColors;
