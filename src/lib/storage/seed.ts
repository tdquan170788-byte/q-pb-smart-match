import type { Member } from "@/types";

function createSeedMember(
  id: string,
  name: string,
  nickname: string
): Member {
  return {
    id,
    name,
    nickname,
    createdAt: "2026-01-01T00:00:00.000Z",

    // Overall
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,

    // Normal Mode
    ratingNormal: 1000,
    winsNormal: 0,
    lossesNormal: 0,
    matchesNormal: 0,
    pointsForNormal: 0,
    pointsAgainstNormal: 0,

    // Team Mode
    ratingTeam: 1000,
    winsTeam: 0,
    lossesTeam: 0,
    matchesTeam: 0,
    pointsForTeam: 0,
    pointsAgainstTeam: 0,
  };
}

export const seededMembers: Member[] = [
  createSeedMember("m1", "Thụy", "T"),
  createSeedMember("m2", "Sơn", "S"),
  createSeedMember("m3", "Đức", "D"),
  createSeedMember("m4", "Cường", "C"),
  createSeedMember("m5", "Tùng", "Tùng"),
  createSeedMember("m6", "Quân", "Q"),
  createSeedMember("m7", "Kon", "K"),
  createSeedMember("m8", "Vũ", "V"),
];
