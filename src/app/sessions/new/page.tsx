"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import type { Member, SessionMode } from "@/types";
import { createSession, ensureSeedData, getMembers } from "@/lib/storage";

function todayInputValue() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

export default function NewSessionPage() {
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);

  const [date, setDate] = useState(todayInputValue());
  const [mode, setMode] = useState<SessionMode>("normal");
  const [pointToWin, setPointToWin] = useState(11);
  const [courtCount, setCourtCount] = useState(1);

  const [memberIds, setMemberIds] = useState<string[]>([]);

  const [teamAMemberIds, setTeamAMemberIds] = useState<string[]>([]);
  const [teamBMemberIds, setTeamBMemberIds] = useState<string[]>([]);

  useEffect(() => {
    ensureSeedData();
    setMembers(getMembers());
  }, []);

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [members]);

  const memberIdSet = useMemo(() => new Set(memberIds), [memberIds]);
  const teamASet = useMemo(() => new Set(teamAMemberIds), [teamAMemberIds]);
  const teamBSet = useMemo(() => new Set(teamBMemberIds), [teamBMemberIds]);

  function toggleMember(memberId: string) {
    setMemberIds((prev) => {
      if (prev.includes(memberId)) {
        setTeamAMemberIds((ids) => ids.filter((id) => id !== memberId));
        setTeamBMemberIds((ids) => ids.filter((id) => id !== memberId));

        return prev.filter((id) => id !== memberId);
      }

      return [...prev, memberId];
    });
  }

  function assignToTeamA(memberId: string) {
    if (!memberIdSet.has(memberId)) return;

    setTeamBMemberIds((prev) => prev.filter((id) => id !== memberId));
    setTeamAMemberIds((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId);
      }

      return [...prev, memberId];
    });
  }

  function assignToTeamB(memberId: string) {
    if (!memberIdSet.has(memberId)) return;

    setTeamAMemberIds((prev) => prev.filter((id) => id !== memberId));
    setTeamBMemberIds((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId);
      }

      return [...prev, memberId];
    });
  }

  function fillTeamFromMembers() {
    const ids = [...memberIds];
    const half = Math.ceil(ids.length / 2);

    setTeamAMemberIds(ids.slice(0, half));
    setTeamBMemberIds(ids.slice(half));
  }

  function validateBeforeSubmit() {
    if (!date) {
      alert("Vui lòng chọn ngày chơi.");
      return false;
    }

    if (pointToWin <= 0) {
      alert("Point to win phải lớn hơn 0.");
      return false;
    }

    if (courtCount <= 0) {
      alert("Số sân phải lớn hơn 0.");
      return false;
    }

    if (memberIds.length < 4) {
      alert("Cần ít nhất 4 thành viên để tạo session.");
      return false;
    }

    if (mode === "team") {
      if (teamAMemberIds.length === 0 || teamBMemberIds.length === 0) {
        alert("Team mode cần chia đủ Team A và Team B.");
        return false;
      }

      const mergedTeamMemberIds = [...teamAMemberIds, ...teamBMemberIds];
      const uniqueTeamMemberIds = new Set(mergedTeamMemberIds);

      if (uniqueTeamMemberIds.size !== mergedTeamMemberIds.length) {
        alert("Một thành viên không thể nằm ở cả 2 đội.");
        return false;
      }

      const allInMembers = mergedTeamMemberIds.every((id) =>
        memberIdSet.has(id)
      );

      if (!allInMembers) {
        alert("Có thành viên trong team chưa được chọn ở danh sách thành viên.");
        return false;
      }
    }

    return true;
  }

  function handleCreateSession() {
    if (!validateBeforeSubmit()) return;

    const created = createSession({
      date,
      pointToWin,
      memberIds,
      mode,
      courtCount,
      teamConfig:
        mode === "team"
          ? {
              teamAMemberIds,
              teamBMemberIds,
            }
          : undefined,
    });

    router.push(`/sessions/${created.id}`);
  }

  const unassignedTeamMemberIds = useMemo(() => {
    if (mode !== "team") return [];

    return memberIds.filter((id) => !teamASet.has(id) && !teamBSet.has(id));
  }, [mode, memberIds, teamASet, teamBSet]);

  return (
    <AppShell
      title="Tạo session mới"
      subtitle="Tạo buổi chơi mới cho Q-PB Smart Match"
    >
      <div className="space-y-4">
        <SectionCard title="Thông tin session">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldBlock label="Ngày chơi">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </FieldBlock>

            <FieldBlock label="Mode">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMode("normal")}
                  className={`flex-1 rounded-2xl px-4 py-3 font-semibold ${
                    mode === "normal"
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  Normal
                </button>

                <button
                  type="button"
                  onClick={() => setMode("team")}
                  className={`flex-1 rounded-2xl px-4 py-3 font-semibold ${
                    mode === "team"
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  Team
                </button>
              </div>
            </FieldBlock>

            <FieldBlock label="Điểm chạm thắng">
              <input
                type="number"
                min={1}
                value={pointToWin}
                onChange={(e) => setPointToWin(Number(e.target.value) || 11)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </FieldBlock>

            <FieldBlock label="Số sân">
              <input
                type="number"
                min={1}
                value={courtCount}
                onChange={(e) => setCourtCount(Number(e.target.value) || 1)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </FieldBlock>
          </div>
        </SectionCard>

        <SectionCard
          title="Chọn thành viên"
          action={
            <div className="text-sm text-slate-500">
              Đã chọn{" "}
              <span className="font-semibold text-slate-900">
                {memberIds.length}
              </span>{" "}
              người
            </div>
          }
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sortedMembers.map((member) => {
              const checked = memberIdSet.has(member.id);

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleMember(member.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    checked
                      ? "border-brand-500 bg-brand-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {member.name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {member.nickname?.trim()
                          ? `Biệt danh: ${member.nickname}`
                          : "Chưa có biệt danh"}
                      </div>
                    </div>

                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        checked
                          ? "bg-brand-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {checked ? "Đã chọn" : "Chọn"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {mode === "team" ? (
          <SectionCard
            title="Chia đội"
            action={
              <button
                type="button"
                onClick={fillTeamFromMembers}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
              >
                Chia nhanh 50/50
              </button>
            }
          >
            <div className="mb-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              Chọn thành viên ở trên trước, sau đó bấm vào từng người để đưa vào
              <strong> Team A</strong> hoặc <strong>Team B</strong>.
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-base font-semibold text-slate-900">
                  Chưa vào đội
                </div>

                <div className="mt-3 space-y-3">
                  {unassignedTeamMemberIds.length === 0 ? (
                    <div className="text-sm text-slate-500">Không còn ai.</div>
                  ) : (
                    unassignedTeamMemberIds.map((id) => {
                      const member = members.find((item) => item.id === id);
                      if (!member) return null;

                      return (
                        <div
                          key={id}
                          className="rounded-2xl border border-slate-200 p-3"
                        >
                          <div className="font-medium text-slate-900">
                            {member.name}
                          </div>

                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => assignToTeamA(id)}
                              className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                            >
                              Vào Team A
                            </button>

                            <button
                              type="button"
                              onClick={() => assignToTeamB(id)}
                              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                            >
                              Vào Team B
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <TeamColumn
                title="Team A"
                memberIds={teamAMemberIds}
                allMembers={members}
                onRemove={assignToTeamA}
                onMoveToOther={assignToTeamB}
              />

              <TeamColumn
                title="Team B"
                memberIds={teamBMemberIds}
                allMembers={members}
                onRemove={assignToTeamB}
                onMoveToOther={assignToTeamA}
              />
            </div>
          </SectionCard>
        ) : null}

        <SectionCard title="Tóm tắt session">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SummaryBox label="Mode" value={mode} />
            <SummaryBox label="Members" value={memberIds.length} />
            <SummaryBox label="Point to win" value={pointToWin} />
            <SummaryBox label="Court" value={courtCount} />
          </div>

          {mode === "team" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-semibold text-slate-900">Team A</div>
                <div className="mt-2 text-sm text-slate-600">
                  {teamAMemberIds.length > 0
                    ? teamAMemberIds
                        .map(
                          (id) => members.find((item) => item.id === id)?.name ?? id
                        )
                        .join(", ")
                    : "Chưa có người"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-semibold text-slate-900">Team B</div>
                <div className="mt-2 text-sm text-slate-600">
                  {teamBMemberIds.length > 0
                    ? teamBMemberIds
                        .map(
                          (id) => members.find((item) => item.id === id)?.name ?? id
                        )
                        .join(", ")
                    : "Chưa có người"}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleCreateSession}
              className="rounded-2xl bg-brand-600 px-5 py-3 font-semibold text-white"
            >
              Tạo session
            </button>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
      {children}
    </div>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function TeamColumn({
  title,
  memberIds,
  allMembers,
  onRemove,
  onMoveToOther,
}: {
  title: string;
  memberIds: string[];
  allMembers: Member[];
  onRemove: (memberId: string) => void;
  onMoveToOther: (memberId: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-base font-semibold text-slate-900">{title}</div>
        <div className="text-sm text-slate-500">{memberIds.length} người</div>
      </div>

      <div className="mt-3 space-y-3">
        {memberIds.length === 0 ? (
          <div className="text-sm text-slate-500">Chưa có người.</div>
        ) : (
          memberIds.map((id) => {
            const member = allMembers.find((item) => item.id === id);
            if (!member) return null;

            return (
              <div key={id} className="rounded-2xl border border-slate-200 p-3">
                <div className="font-medium text-slate-900">{member.name}</div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onRemove(id)}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    Bỏ khỏi đội
                  </button>

                  <button
                    type="button"
                    onClick={() => onMoveToOther(id)}
                    className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Chuyển đội
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
