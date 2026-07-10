import type { Member, MemberForm } from "@/types";

import { safeRead, safeWrite } from "./local";

const MEMBERS_KEY = "qpb_members";

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function withMemberDefaults(
  member: Partial<Member> & Pick<Member, "id" | "name">
): Member {
  return {
    id: member.id,
    name: member.name,
    nickname: member.nickname ?? "",
    createdAt: member.createdAt ?? new Date().toISOString(),

    rating: member.rating ?? 1000,
    wins: member.wins ?? 0,
    losses: member.losses ?? 0,
    matches: member.matches ?? 0,

    ratingNormal: member.ratingNormal ?? 1000,
    winsNormal: member.winsNormal ?? 0,
    lossesNormal: member.lossesNormal ?? 0,
    matchesNormal: member.matchesNormal ?? 0,
    pointsForNormal: member.pointsForNormal ?? 0,
    pointsAgainstNormal: member.pointsAgainstNormal ?? 0,

    ratingTeam: member.ratingTeam ?? 1000,
    winsTeam: member.winsTeam ?? 0,
    lossesTeam: member.lossesTeam ?? 0,
    matchesTeam: member.matchesTeam ?? 0,
    pointsForTeam: member.pointsForTeam ?? 0,
    pointsAgainstTeam: member.pointsAgainstTeam ?? 0,
  };
}

export function getMembers(): Member[] {
  const members = safeRead<Member[]>(MEMBERS_KEY, []);
  if (!Array.isArray(members)) return [];
  return members.map((member) => withMemberDefaults(member));
}

export function saveMembers(members: Member[]): void {
  safeWrite(
    MEMBERS_KEY,
    members.map((member) => withMemberDefaults(member))
  );
}

export function getMemberById(memberId: string): Member | undefined {
  return getMembers().find((member) => member.id === memberId);
}

export function createMember(payload: MemberForm): Member {
  const members = getMembers();

  const newMember = withMemberDefaults({
    id: createId("member"),
    name: payload.name.trim(),
    nickname: payload.nickname?.trim() || "",
    createdAt: new Date().toISOString(),
  });

  saveMembers([newMember, ...members]);
  return newMember;
}

export function updateMember(
  memberId: string,
  payload: Partial<MemberForm>
): Member | undefined {
  const members = getMembers();

  let updatedMember: Member | undefined;

  const nextMembers = members.map((member) => {
    if (member.id !== memberId) return member;

    updatedMember = withMemberDefaults({
      ...member,
      name: payload.name?.trim() ?? member.name,
      nickname: payload.nickname?.trim() ?? member.nickname ?? "",
    });

    return updatedMember;
  });

  saveMembers(nextMembers);
  return updatedMember;
}

export function deleteMember(memberId: string): void {
  saveMembers(getMembers().filter((member) => member.id !== memberId));
}