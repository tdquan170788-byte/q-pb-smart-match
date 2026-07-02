import type { Player, SessionRecord, MatchRecord } from "@/types";

const PLAYERS_KEY = "qpb_players";
const SESSIONS_KEY = "qpb_sessions";
const MATCHES_KEY = "qpb_matches";

const seedPlayers: Player[] = [
  { id: "p1", name: "Thuỵ", rating: 1500, wins: 0, losses: 0, matches: 0, createdAt: new Date().toISOString() },
  { id: "p2", name: "Sơn", rating: 1500, wins: 0, losses: 0, matches: 0, createdAt: new Date().toISOString() },
  { id: "p3", name: "Đức", rating: 1500, wins: 0, losses: 0, matches: 0, createdAt: new Date().toISOString() },
  { id: "p4", name: "Cường", rating: 1500, wins: 0, losses: 0, matches: 0, createdAt: new Date().toISOString() },
  { id: "p5", name: "Tùng", rating: 1500, wins: 0, losses: 0, matches: 0, createdAt: new Date().toISOString() },
  { id: "p6", name: "Quân", rating: 1500, wins: 0, losses: 0, matches: 0, createdAt: new Date().toISOString() },
  { id: "p7", name: "Kon", rating: 1500, wins: 0, losses: 0, matches: 0, createdAt: new Date().toISOString() },
  { id: "p8", name: "Vũ", rating: 1500, wins: 0, losses: 0, matches: 0, createdAt: new Date().toISOString() }
];

function isBrowser() {
  return typeof window !== "undefined";
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function ensureSeedData() {
  if (!isBrowser()) return;
  const players = readJSON<Player[]>(PLAYERS_KEY, []);
  if (!players.length) {
    writeJSON(PLAYERS_KEY, seedPlayers);
  }

  const sessions = readJSON<SessionRecord[]>(SESSIONS_KEY, []);
  if (!sessions.length) {
    writeJSON(SESSIONS_KEY, []);
  }

  const matches = readJSON<MatchRecord[]>(MATCHES_KEY, []);
  if (!matches.length) {
    writeJSON(MATCHES_KEY, []);
  }
}

export function getPlayers(): Player[] {
  return readJSON<Player[]>(PLAYERS_KEY, []);
}

export function savePlayers(players: Player[]) {
  writeJSON(PLAYERS_KEY, players);
}

export function getSessions(): SessionRecord[] {
  return readJSON<SessionRecord[]>(SESSIONS_KEY, []);
}

export function saveSessions(sessions: SessionRecord[]) {
  writeJSON(SESSIONS_KEY, sessions);
}

export function getMatches(): MatchRecord[] {
  return readJSON<MatchRecord[]>(MATCHES_KEY, []);
}

export function saveMatches(matches: MatchRecord[]) {
  writeJSON(MATCHES_KEY, matches);
}