#!/usr/bin/env ts-node

/**
 * 에레디비지에 선수 매핑 파일 자동 생성 (단일 파일 버전)
 * - DB(football_teams, football_players)에서 읽어오기
 * - player_id=0 제거, 중복(player_id) 정제
 * - 팀별 배열 + 전체 배열로 TS 파일 생성
 *
 * 실행 예:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ts-node src/app/test/players/generate-eredivisie.ts
 */

import 'dotenv/config'
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// ===== 설정 =====
const OUTPUT_PATH = path.resolve("src/domains/livescore/constants/players/eredivisie.ts");
const EREDIVISIE_LEAGUE_ID = Number(process.env.EREDIVISIE_LEAGUE_ID ?? 88);
const WITH_NUMBER_AND_AGE = true; // 등번호/나이도 매핑에 포함
const SKIP_ZERO_ID = true; // player_id=0 제거
// ===============

// --- 로컬 타입 (파일 하나에 모두 포함) ---
type PlayerMapping = {
  id: number;
  name: string;
  korean_name: string | null;
  team_id: number;
  position: "Goalkeeper" | "Defender" | "Midfielder" | "Attacker" | undefined;
  number?: number | null;
  age?: number | null;
};

type TeamRow = { team_id: number; name: string };

type PlayerRow = {
  player_id: number;
  name: string;
  team_id: number;
  position: string | null;
  number?: number | null;
  age?: number | null;
};

// --- 환경변수 로드 ---
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// --- 유틸 함수들 ---
function normPos(raw: string | null): PlayerMapping["position"] {
  if (!raw) return undefined;
  const p = raw.toLowerCase();
  if (p.startsWith("g")) return "Goalkeeper";
  if (p.startsWith("d")) return "Defender";
  if (p.startsWith("m")) return "Midfielder";
  if (p.startsWith("a") || p.startsWith("f") || p.startsWith("s")) return "Attacker";
  return undefined;
}

function esc(str: string) {
  return str.replaceAll("\\", "\\\\").replaceAll("`", "\\`").replaceAll('"', '\\"');
}

// 동일 player_id 다수일 때 우선순위 높은 1개만 유지
// 우선순위: number 있음(4) > position 있음(2) > age 있음(1)
function dedupeById(rows: PlayerRow[]): PlayerRow[] {
  const score = (p: PlayerRow) =>
    (p.number != null ? 4 : 0) + (p.position ? 2 : 0) + (p.age != null ? 1 : 0);

  const best = new Map<number, PlayerRow>();
  for (const r of rows) {
    if (SKIP_ZERO_ID && r.player_id === 0) continue;
    const prev = best.get(r.player_id);
    if (!prev || score(r) > score(prev)) best.set(r.player_id, r);
  }
  return [...best.values()];
}

function varNameFromTeamName(name: string) {
  return (
    name
      .replaceAll(/[^A-Za-z0-9]/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((x, i) => (i === 0 ? x : x[0].toUpperCase() + x.slice(1)))
      .join("_")
      .toUpperCase() + "_PLAYERS"
  );
}

// --- 메인 ---
async function main() {
  console.log(`📡 에레디비지에(league_id=${EREDIVISIE_LEAGUE_ID}) 팀/선수 읽는 중...`);

  // 1) 팀 목록
  const { data: teams, error: teamErr } = (await supabase
    .from("football_teams")
    .select("team_id, name")
    .eq("league_id", EREDIVISIE_LEAGUE_ID)
    .eq("is_active", true)
    .order("name", { ascending: true })) as unknown as { data: TeamRow[]; error: any };

  if (teamErr) throw new Error(`팀 조회 실패: ${teamErr.message}`);
  if (!teams?.length) throw new Error("활성 팀 없음");
  const teamIds = teams.map((t) => t.team_id);

  // 2) 선수 목록  ⚠️ name_ko 제거 (스키마에 없음)
  const { data: players, error: playerErr } = (await supabase
    .from("football_players")
    .select("player_id, name, team_id, position, number, age")
    .in("team_id", teamIds)
    .eq("is_active", true)) as unknown as { data: PlayerRow[]; error: any };

  if (playerErr) throw new Error(`선수 조회 실패: ${playerErr.message}`);

  // 3) 팀별 그룹
  const byTeam = new Map<number, PlayerRow[]>();
  for (const p of players ?? []) {
    if (!byTeam.has(p.team_id)) byTeam.set(p.team_id, []);
    byTeam.get(p.team_id)!.push(p);
  }

  // 4) 포지션 정렬 우선순위
  const posOrder: Record<string, number> = {
    Goalkeeper: 0,
    Defender: 1,
    Midfielder: 2,
    Attacker: 3,
  };

  // 5) TS 소스 생성
  let out = "";
  out += `// 자동생성 파일: 에레디비지에 선수 매핑\n`;
  out += `// 생성시각: ${new Date().toISOString()}\n\n`;
  out += `export type PlayerMapping = {\n`;
  out += `  id: number;\n`;
  out += `  name: string;\n`;
  out += `  korean_name: string | null;\n`;
  out += `  team_id: number;\n`;
  out += `  position: "Goalkeeper" | "Defender" | "Midfielder" | "Attacker" | undefined;\n`;
  out += `  number?: number | null;\n`;
  out += `  age?: number | null;\n`;
  out += `};\n\n`;

  const total: PlayerMapping[] = [];

  for (const team of teams) {
    const rows = dedupeById(byTeam.get(team.team_id) ?? []);
    const mappings: PlayerMapping[] = rows.map((r) => ({
      id: r.player_id,
      name: r.name,
      korean_name: null, // 현재 스키마에 name_ko 없음 → null로 고정
      team_id: r.team_id,
      position: normPos(r.position),
      number: WITH_NUMBER_AND_AGE ? r.number ?? null : undefined,
      age: WITH_NUMBER_AND_AGE ? r.age ?? null : undefined,
    }));

    // 정렬: 포지션 → 등번호 → 이름
    mappings.sort((a, b) => {
      const pa = a.position ?? "zz";
      const pb = b.position ?? "zz";
      const oa = (posOrder as any)[pa] ?? 9;
      const ob = (posOrder as any)[pb] ?? 9;
      if (oa !== ob) return oa - ob;
      const na = (a.number ?? 9999) - (b.number ?? 9999);
      if (na !== 0) return na;
      return a.name.localeCompare(b.name);
    });

    total.push(...mappings);

    const varName = varNameFromTeamName(team.name);
    out += `// ${team.name} (Team ID: ${team.team_id}) - ${mappings.length}명\n`;
    out += `export const ${varName}: PlayerMapping[] = [\n`;
    for (const m of mappings) {
      const pos = m.position ? `"${m.position}"` : "undefined";
      const kn = m.korean_name ? `"${esc(m.korean_name)}"` : "null";
      const num = WITH_NUMBER_AND_AGE ? `, number: ${m.number ?? null}` : "";
      const age = WITH_NUMBER_AND_AGE ? `, age: ${m.age ?? null}` : "";
      out += `  { id: ${m.id}, name: "${esc(m.name)}", korean_name: ${kn}, team_id: ${m.team_id}, position: ${pos}${num}${age} },\n`;
    }
    out += `];\n\n`;
  }

  // 전체 합본
  out += `// 에레디비지에 전체 선수 (${total.length}명, ${teams.length}개 팀)\n`;
  out += `export const EREDIVISIE_PLAYERS: PlayerMapping[] = [\n`;
  for (const team of teams) {
    out += `  ...${varNameFromTeamName(team.name)},\n`;
  }
  out += `];\n`;

  // 6) 파일 쓰기
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, out, "utf-8");

  console.log(`✅ 생성 완료: ${OUTPUT_PATH}`);
  console.log(
    `   팀 수: ${teams.length}, 총 선수 수(중복 제거${SKIP_ZERO_ID ? "/id=0 제외" : ""}): ${total.length}`,
  );
}

main().catch((e) => {
  console.error("❌ 생성 실패:", e);
  process.exit(1);
});
