"use client";

import { useEffect } from "react";
import { addRecentlyVisited } from "@/domains/layout/utils/recentlyVisited";

interface RecentlyVisitedBoardEffectProps {
  id: string;
  slug: string;
  name: string;
}

export default function RecentlyVisitedBoardEffect({
  id,
  slug,
  name,
}: RecentlyVisitedBoardEffectProps) {
  useEffect(() => {
    if (!id || !name) return;
    addRecentlyVisited({ id, slug, name });
  }, [id, slug, name]);

  return null;
}
