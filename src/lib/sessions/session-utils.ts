import type { Player } from "@/types";

export function getTeamDisplayNames(
  memberIds: string[],
  playerMap: Map<string, Player>
): string[] {
  return memberIds.map((id) => playerMap.get(id)?.name ?? "Unknown");
}