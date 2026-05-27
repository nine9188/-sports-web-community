'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/shared/lib/gtag';

interface MatchViewTrackerProps {
  matchId: string;
  league?: string;
  homeTeam?: string;
  awayTeam?: string;
  status?: string;
}

export default function MatchViewTracker({
  matchId,
  league,
  homeTeam,
  awayTeam,
  status,
}: MatchViewTrackerProps) {
  useEffect(() => {
    trackEvent('match_view', {
      match_id: matchId,
      league,
      home_team: homeTeam,
      away_team: awayTeam,
      status,
      page: window.location.pathname,
    });
  }, [awayTeam, homeTeam, league, matchId, status]);

  return null;
}

