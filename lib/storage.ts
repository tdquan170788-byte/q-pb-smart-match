import type {
  MatchRecord,
  Player,
  PlayerForm,
  SessionRecord,
} from "@/types";

const PLAYERS_KEY = "qpb_players";
const MATCHES_KEY = "qpb_matches";
const SESSIONS_KEY = "qpb_sessions";

const now = new Date().toISOString();

const seededPlayers: Player[] = [
  { id: "p1", name: "Thụy", nickname: "", rating: 1000, wins: 0, losses: 0, matches: 0, createdAt: now },
  { id: "p2", name: "Sơn", nickname: "", rating: 1000, wins: 0, losses: 0, matches: 0, createdAt: now },
  { id: "p3", name: "Đức", nickname: "", rating: 1000, wins: 0, losses: 0, matches: 0, createdAt: now },
  { id: "p4", name: "Cường", nickname: "", rating: 1000, wins: 0, losses: 0, matches: 0, createdAt: now },
  { id: "p5", name: "Tùng", nickname: "", rating: 1000, wins: 0, losses: 0, matches: 0, createdAt: now },
  { id: "p6", name: "Quân", nickname: "", rating: 1000, wins: 0, losses: 0, matches: 0, createdAt: now },
  { id: "p7", name: "Kon", nickname: "", rating: 1000, wins: 0, losses: 0, matches: 0, createdAt: now },
  { id: "p8", name: "Vũ", nickname: "", rating: 1000, wins: 0, losses: 0, matches: 0, createdAt: now },
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

/* =========================
   SEED
========================= */

export function ensureSeedData() {
  if (!isBrowser()) return;

  const players = safeRead<Player[]>(PLAYERS_KEY, []);
  if (players.length === 0) {
    safeWrite(PLAYERS_KEY, seededPlayers);
  }

  const matches = safeRead<MatchRecord[]>(MATCHES_KEY, []);
  if (matches.length === 0) {
    safeWrite(MATCHES_KEY, []);
  }

  const sessions = safeRead<SessionRecord[]>(SESSIONS_KEY, []);
  if (sessions.length === 0) {
    safeWrite(SESSIONS_KEY, []);
  }
}

export function ensureSeedPlayers() {
  ensureSeedData();
}

export function resetSeedPlayers() {
  safeWrite(PLAYERS_KEY, seededPlayers);
}

/* =========================
   PLAYERS
========================= */

export function getPlayers(): Player[] {
  return safeRead<Player[]>(PLAYERS_KEY, seededPlayers);
}

export function getPlayerById(playerId: string): Player | undefined {
  return getPlayers().find((p) => p.id === playerId);
}

export function getPlayersByIds(playerIds: string[]): Player[] {
  const map = new Map(getPlayers().map((p) => [p.id, p]));
  return playerIds.map((id) => map.get(id)).filter(Boolean) as Player[];
}

export function savePlayers(players: Player[]) {
  safeWrite(PLAYERS_KEY, players);
}

export function createPlayer(form: PlayerForm): Player {
  const players = getPlayers();

  const newPlayer: Player = {
    id: createId("player"),
    name: form.name.trim(),
    nickname: form.nickname.trim(),
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  };

  const next = [...players, newPlayer];
  savePlayers(next);
  return newPlayer;
}

export function addPlayer(form: PlayerForm): Player {
  return createPlayer(form);
}

export function updatePlayer(playerId: string, form: PlayerForm): Player | null {
  const players = getPlayers();
  const index = players.findIndex((p) => p.id === playerId);
  if (index === -1) return null;

  const updated: Player = {
    ...players[index],
    name: form.name.trim(),
    nickname: form.nickname.trim(),
  };

  players[index] = updated;
  savePlayers(players);
  return updated;
}

export function deletePlayer(playerId: string) {
  const next = getPlayers().filter((p) => p.id !== playerId);
  savePlayers(next);
}

/* =========================
   MATCHES
========================= */

export function getMatches(): MatchRecord[] {
  return safeRead<MatchRecord[]>(MATCHES_KEY, []);
}

export function getMatchesBySession(sessionId: string): MatchRecord[] {
  return getMatches()
    .filter((m) => m.sessionId === sessionId)
    .sort((a, b) => a.round - b.round);
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

  const next = [newMatch, ...matches];
  saveMatches(next);
  return newMatch;
}

/* =========================
   SESSIONS
========================= */

export function getSessions(): SessionRecord[] {
  return safeRead<SessionRecord[]>(SESSIONS_KEY, []);
}

export function getSessionById(sessionId: string): SessionRecord | undefined {
  return getSessions().find((s) => s.id === sessionId);
}

export function saveSessions(sessions: SessionRecord[]) {
  safeWrite(SESSIONS_KEY, sessions);
}

export function addSession(session: Omit<SessionRecord, "id">): SessionRecord {
  const sessions = getSessions();

  const newSession: SessionRecord = {
    ...session,
    id: createId("session"),
  };

  const next = [newSession, ...sessions];
  saveSessions(next);
  return newSession;
}