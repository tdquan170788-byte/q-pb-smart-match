import type { Member } from "@/types";

export function getTeamDisplayNames(
  memberIds: string[],
  memberMap: Map<string, Member>
): string[] {
  return memberIds.map((id) => memberMap.get(id)?.name ?? "Unknown");
}