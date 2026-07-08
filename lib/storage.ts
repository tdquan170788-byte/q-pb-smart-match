import type { MatchRecord, Player, SessionRecord } from "@/types";

const PLAYERS_KEY = "qpb_players";
const MATCHES_KEY = "qpb_matches";
const SESSIONS_KEY = "qpb_sessions";

function createSeedPlayer(
  id: string,
  name: string,
  nickname: string
): Player {
  return {
    id,
    name,
    nickname,
    createdAt: "2026-01-01T00:00:00.000Z",

    // legacy / overall
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,

    // normal
    ratingNormal: 1000,
    winsNormal: 0,
    lossesNormal: 0,
    matchesNormal: 0,
    pointsForNormal: 0,
    pointsAgainstNormal: 0,

    // team
    ratingTeam: 1000,
    winsTeam: 0,
    lossesTeam: 0,
    matchesTeam: 0,
    pointsForTeam: 0,
    pointsAgainstTeam: 0,
  };
}

const seededPlayers: Player[] = [
  createSeedPlayer("p1", "Thụy", "T"),
  createSeedPlayer("p2", "Sơn", "S"),
  createSeedPlayer("p3", "Đức", "D"),
  createSeedPlayer("p4", "Cường", "C"),
  createSeedPlayer("p5", "Tùng", "Tùng"),
  createSeedPlayer("p6", "Quân", "Q"),
  createSeedPlayer("p7", "Kon", "K"),
  createSeedPlayer("p8", "Vũ", "V"),
];

function isBrowser() {
  return typeof window !== "undefined";
}

function safeRead<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const aa = [...a].sort();
  const bb = [...b].sort();
  return aa.every((id, idx) => id === bb[idx]);
}

function withPlayerDefaults(
  player: Partial<Player> & Pick<Player, "id" | "name">
): Player {
  return {
    id: player.id,
    name: player.name,
    nickname: player.nickname ?? "",
    createdAt: player.createdAt ?? new Date().toISOString(),

    rating: player.rating ?? 1000,
    wins: player.wins ?? 0,
    losses: player.losses ?? 0,
    matches: player.matches ?? 0,

    ratingNormal: player.ratingNormal ?? 1000,
    winsNormal: player.winsNormal ?? 0,
    lossesNormal: player.lossesNormal ?? 0,
    matchesNormal: player.matchesNormal ?? 0,
    pointsForNormal: player.pointsForNormal ?? 0,
    pointsAgainstNormal: player.pointsAgainstNormal ?? 0,

    ratingTeam: player.ratingTeam ?? 1000,
    winsTeam: player.winsTeam ?? 0,
    lossesTeam: player.lossesTeam ?? 0,
    matchesTeam: player.matchesTeam ?? 0,
    pointsForTeam: player.pointsForTeam ?? 0,
    pointsAgainstTeam: player.pointsAgainstTeam ?? 0,
  };
}

/* =========================================================
   SEED
========================================================= */

export function seedPlayersIfEmpty() {
  if (!isBrowser()) return;
  const players = safeRead<Player[]>(PLAYERS_KEY, []);
  if (players.length === 0) {
    safeWrite(PLAYERS_KEY, seededPlayers);
  }
}

export function ensureSeedPlayers() {
  seedPlayersIfEmpty();
}

export function ensureSeedData() {
  if (!isBrowser()) return;

  const players = safeRead<Player[]>(PLAYERS_KEY, []);
  if (players.length === 0) {
    safeWrite(PLAYERS_KEY, seededPlayers);
  }

  const matches = safeRead<MatchRecord[]>(MATCHES_KEY, []);
  if (!Array.isArray(matches)) {
    safeWrite(MATCHES_KEY, []);
  }

  const sessions = safeRead<SessionRecord[]>(SESSIONS_KEY, []);
  if (!Array.isArray(sessions)) {
    safeWrite(SESSIONS_KEY, []);
  }
}

export function resetSeedPlayers() {
  safeWrite(PLAYERS_KEY, seededPlayers);
}

/* =========================================================
   PLAYERS
========================================================= */

export function getPlayers(): Player[] {
  const players = safeRead<Player[]>(PLAYERS_KEY, []);
  return players.map((p) => withPlayerDefaults(p));
}

export function savePlayers(players: Player[]) {
  safeWrite(PLAYERS_KEY, players.map((p) => withPlayerDefaults(p)));
}

export function createPlayer(payload: {
  name: string;
  nickname?: string;
}): Player {
  const players = getPlayers();

  const newPlayer = withPlayerDefaults({
    id: createId("player"),
    name: payload.name.trim(),
    nickname: payload.nickname?.trim() || "",
    createdAt: new Date().toISOString(),
  });

  savePlayers([newPlayer, ...players]);
  return newPlayer;
}

export function addPlayer(payload: {
  name: string;
  nickname?: string;
}): Player {
  return createPlayer(payload);
}

export function updatePlayer(
  playerIdOrPlayer: string | Player,
  payload?: {
    name?: string;
    nickname?: string;
  }
) {
  const players = getPlayers();

  if (typeof playerIdOrPlayer !== "string") {
    const updatedPlayer = withPlayerDefaults(playerIdOrPlayer);
    const next = players.map((p) =>
      p.id === updatedPlayer.id ? updatedPlayer : p
    );
    savePlayers(next);
    return;
  }

  const playerId = playerIdOrPlayer;

  const next = players.map((p) => {
    if (p.id !== playerId) return p;
    return withPlayerDefaults({
      ...p,
      name: payload?.name?.trim() ?? p.name,
      nickname: payload?.nickname?.trim() ?? p.nickname ?? "",
    });
  });

  savePlayers(next);
}

export function deletePlayer(playerId: string) {
  const players = getPlayers().filter((p) => p.id !== playerId);
  savePlayers(players);
}

/* =========================================================
   MATCHES
========================================================= */

export function getMatches(): MatchRecord[] {
  return safeRead<MatchRecord[]>(MATCHES_KEY, []);
}

export function saveMatches(matches: MatchRecord[]) {
  safeWrite(MATCHES_KEY, matches);
}

export function addMatch(match: Omit<MatchRecord, "id">): MatchRecord {
  const matches = getMatches();

  const newMatch: MatchRecord = {
    ...match,
    id: createId("match"),
  };

  saveMatches([newMatch, ...matches]);
  return newMatch;
}

export function upsertMatch(payload: {
  sessionId: string;
  round: number;
  court?: number;
  teamA: { playerIds: string[] };
  teamB: { playerIds: string[] };
  scoreA: number;
  scoreB: number;
}): MatchRecord {
  const matches = getMatches();

  const existing = matches.find(
    (m) =>
      m.sessionId === payload.sessionId &&
      m.round === payload.round &&
      (m.court ?? 1) === (payload.court ?? 1) &&
      sameIds(m.teamA.playerIds, payload.teamA.playerIds) &&
      sameIds(m.teamB.playerIds, payload.teamB.playerIds)
  );

  if (existing) {
    const updated: MatchRecord = {
      ...existing,
      scoreA: payload.scoreA,
      scoreB: payload.scoreB,
      court: payload.court ?? existing.court ?? 1,
    };

    saveMatches(matches.map((m) => (m.id === existing.id ? updated : m)));
    return updated;
  }

  const created: MatchRecord = {
    id: createId("match"),
    sessionId: payload.sessionId,
    round: payload.round,
    court: payload.court ?? 1,
    teamA: payload.teamA,
    teamB: payload.teamB,
    scoreA: payload.scoreA,
    scoreB: payload.scoreB,
    createdAt: new Date().toISOString(),
  };

  saveMatches([created, ...matches]);
  return created;
}

/* =========================================================
   SESSIONS
========================================================= */

export function getSessions(): SessionRecord[] {
  return safeRead<SessionRecord[]>(SESSIONS_KEY, []);
}

export function saveSessions(sessions: SessionRecord[]) {
  safeWrite(SESSIONS_KEY, sessions);
}

export function createSession(payload: {
  date: string;
  pointToWin: number;
  participantIds: string[];
  mode?: "normal" | "team";
  courtCount?: number;
  teamConfig?: {
    teamAPlayerIds: string[];
    teamBPlayerIds: string[];
  };
}): SessionRecord {
  const sessions = getSessions();

  const newSession: SessionRecord = {
    id: createId("session"),
    date: payload.date,
    pointToWin: payload.pointToWin,
    participantIds: payload.participantIds,
    createdAt: new Date().toISOString(),
    mode: payload.mode ?? "normal",
    courtCount: payload.courtCount ?? 1,
    teamConfig: payload.teamConfig,
  };

  saveSessions([newSession, ...sessions]);
  return newSession;
}

export function addSession(session: Omit<SessionRecord, "id">): SessionRecord {
  const sessions = getSessions();

  const newSession: SessionRecord = {
    ...session,
    id: createId("session"),
  };

  saveSessions([newSession, ...sessions]);
  return newSession;
}