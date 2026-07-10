import { getMatchesBySessionId, getMembers, getSessions } from "@/lib/storage";
import { generateScheduleForSession } from "@/lib/session";

export function getSessionMatches(sessionId: string) {
  return getMatchesBySessionId(sessionId).sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    return (a.court ?? 1) - (b.court ?? 1);
  });
}

export function getSessionDetailView(sessionId: string) {
  const members = getMembers();
  const sessions = getSessions();

  const session = sessions.find((item) => item.id === sessionId);

  if (!session) return null;

  const memberMap = new Map(members.map((member) => [member.id, member.name]));
  const schedule = generateScheduleForSession(session);
  const matches = getSessionMatches(sessionId);

  return {
    session,
    memberMap,
    schedule,
    matches,
  };
}
