"use server";

import { fetchMatchesByDate } from "@/app/actions/footballApi";

export async function getMatchesByDate(date: string) {
  return await fetchMatchesByDate(date);
} 