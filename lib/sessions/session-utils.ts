import type { MatchRecord, Player, SessionRecord } from "@/types";
import { getMatches, getPlayers, getSessions } from "@/lib/storage";

export function getSessionById(sessionId: string): SessionRecord | null {
  const sessions = getSessions();
  return sessions.find((s) => s.id === sessionId) ?? null;
}

export function getPlayerMap(players?: Player[]) {
  const list = players ?? getPlayers();
  return new Map(list.map((p) => [p.id, p]));
}

export function getSessionMatches(sessionId: string): MatchRecord[] {
  return getMatches()
    .filter((m) => m.sessionId === sessionId)
    .sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      return (a.court ?? 1) - (b.court ?? 1);
    });
}

export function groupMatchesByRound(matches: MatchRecord[]) {
  const roundMap = new Map<number, MatchRecord[]>();

  for (const match of matches) {
    const list = roundMap.get(match.round) ?? [];
    list.push(match);
    roundMap.set(match.round, list);
  }

  return [...roundMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([round, roundMatches]) => ({
      round,
      matches: roundMatches.sort((a, b) => (a.court ?? 1) - (b.court ?? 1)),
    }));
}

export function getPlayerDisplayName(playerId: string, playerMap: Map<string, Player>) {
  const player = playerMap.get(playerId);
  if (!player) return playerId;

  if (player.nickname?.trim()) {
    return `${player.name} (${player.nickname})`;
  }

  return player.name;
}

export function getTeamDisplayNames(
  playerIds: string[],
  playerMap: Map<string, Player>
) {
  return playerIds.map((id) => getPlayerDisplayName(id, playerMap));
}

export function getSessionParticipants(
  session: SessionRecord,
  playerMap: Map<string, Player>
) {
  return session.participantIds.map((id) => ({
    id,
    label: getPlayerDisplayName(id, playerMap),
  }));
}