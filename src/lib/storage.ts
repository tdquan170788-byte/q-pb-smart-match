import type { MatchRecord, Player, SessionRecord } from "@/types/domain";
import { safeRead, safeWrite, isBrowser } from "./local";
import { seededPlayers } from "./seed";
import { playersRepo } from "./players.repo";
import { sessionsRepo } from "./sessions.repo";
import { matchesRepo } from "./matches.repo";

const PLAYERS_KEY = "qpb_players";
const MATCHES_KEY = "qpb_matches";
const SESSIONS_KEY = "qpb_sessions";

/* =========================================================
   SEED HELPERS
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
  if (matches.length === 0) {
    safeWrite(MATCHES_KEY, []);
  }

  const sessions = safeRead<SessionRecord[]>(SESSIONS_KEY, []);
  if (sessions.length === 0) {
    safeWrite(SESSIONS_KEY, []);
  }
}

export function resetSeedPlayers() {
  safeWrite(PLAYERS_KEY, seededPlayers);
}

/* =========================================================
   BACKWARD COMPAT EXPORTS
   (để page cũ không vỡ ngay khi bạn refactor dần)
========================================================= */

export const getPlayers = () => playersRepo.getAll();
export const savePlayers = (players: Player[]) => playersRepo.saveAll(players);
export const createPlayer = (payload: { name: string; nickname?: string }) =>
  playersRepo.create(payload);
export const addPlayer = (payload: { name: string; nickname?: string }) =>
  playersRepo.create(payload);
export const updatePlayer = (
  playerIdOrPlayer: string | Player,
  payload?: { name?: string; nickname?: string }
) => playersRepo.update(playerIdOrPlayer, payload);
export const deletePlayer = (playerId: string) => playersRepo.delete(playerId);

export const getSessions = () => sessionsRepo.getAll();
export const saveSessions = (sessions: SessionRecord[]) =>
  sessionsRepo.saveAll(sessions);
export const createSession = (payload: {
  date: string;
  pointToWin: number;
  participantIds: string[];
  mode?: "normal" | "team";
  courtCount?: number;
  teamConfig?: {
    teamAMemberIds: string[];
    teamBMemberIds: string[];
  };
}) => sessionsRepo.create(payload);
export const addSession = (session: Omit<SessionRecord, "id">) =>
  sessionsRepo.add(session);

export const getMatches = () => matchesRepo.getAll();
export const saveMatches = (matches: MatchRecord[]) =>
  matchesRepo.saveAll(matches);
export const addMatch = (match: Omit<MatchRecord, "id">) => matchesRepo.add(match);
export const upsertMatch = (payload: {
  sessionId: string;
  round: number;
  court?: number;
  teamA: { memberIds: string[] };
  teamB: { memberIds: string[] };
  scoreA: number;
  scoreB: number;
}) => matchesRepo.upsertByScheduleSlot(payload);

export { playersRepo, sessionsRepo, matchesRepo };