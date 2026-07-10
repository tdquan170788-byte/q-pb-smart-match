import { getMatches, getPlayers, getSessions } from "@/lib/storage";
import { generateScheduleForSession } from "@/lib/domain/scheduler/scheduler.service";

export function getSessionMatches(sessionId: string) {
  return getMatches()
    .filter((m) => m.sessionId === sessionId)
    .sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      return (a.court ?? 1) - (b.court ?? 1);
    });
}

export function getSessionDetailView(sessionId: string) {
  const players = getPlayers();
  const sessions = getSessions();
  const session = sessions.find((s) => s.id === sessionId);

  if (!session) return null;

  const playerMap = new Map(players.map((p) => [p.id, p.name]));
  const schedule = generateScheduleForSession(session);
  const matches = getSessionMatches(sessionId);

  return {
    session,
    playerMap,
    schedule,
    matches,
  };
}