export function getPlayerSeasonCandidates(preferredSeason?: number | null): number[] {
  const currentYear = new Date().getFullYear();
  const europeanSeason = new Date().getMonth() >= 6 ? currentYear : currentYear - 1;

  return [...new Set([
    preferredSeason,
    currentYear,
    europeanSeason,
    currentYear - 1,
  ].filter((season): season is number => typeof season === 'number'))];
}

export function getDefaultPlayerSeason(): number {
  return getPlayerSeasonCandidates()[0];
}
