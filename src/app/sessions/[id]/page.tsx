"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import SessionMatchCard from "@/components/sessions/session-match-card";

import type { GeneratedSchedule, MatchRecord, Member, SessionRecord } from "@/types";
import {
  ensureSeedData,
  getMatchesBySessionId,
  getMembers,
  getSessionById,
  upsertMatch,
} from "@/lib/storage";
import { generateScheduleForSession } from "@/lib/session";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const [session, setSession] = useState<SessionRecord | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);

  useEffect(() => {
    ensureSeedData();

    setSession(getSessionById(sessionId) ?? null);
    setMembers(getMembers());
    setMatches(getMatchesBySessionId(sessionId));
  }, [sessionId]);

  const memberMap = useMemo(() => {
    return new Map(members.map((member) => [member.id, member]));
  }, [members]);

  const schedule: GeneratedSchedule | null = useMemo(() => {
    if (!session) return null;
    return generateScheduleForSession(session);
  }, [session]);

  function refreshMatches() {
    setMatches(getMatchesBySessionId(sessionId));
  }

  function findSavedMatch(scheduledMatch: {
    round: number;
    court: number;
    teamAMemberIds: string[];
    teamBMemberIds: string[];
  }): MatchRecord | undefined {
    return matches.find(
      (match) =>
        match.round === scheduledMatch.round &&
        (match.court ?? 1) === scheduledMatch.court &&
        sameIds(match.teamA.memberIds, scheduledMatch.teamAMemberIds) &&
        sameIds(match.teamB.memberIds, scheduledMatch.teamBMemberIds)
    );
  }

  function handleSaveScore(match: MatchRecord, scoreA: number, scoreB: number) {
    upsertMatch({
      sessionId: match.sessionId,
      round: match.round,
      court: match.court,
      teamA: match.teamA,
      teamB: match.teamB,
      scoreA,
      scoreB,
    });

    refreshMatches();
  }

  if (!session || !schedule) {
    return (
      <AppShell title="Session" subtitle="Không tìm thấy session">
        <SectionCard title="Không tìm thấy dữ liệu">
          <div className="text-sm text-slate-600">
            Session này không tồn tại hoặc dữ liệu đã bị xoá.
          </div>

          <Link
            href="/sessions"
            className="mt-4 inline-flex rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
          >
            Quay lại tạo session
          </Link>
        </SectionCard>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Session ${new Date(session.date).toLocaleDateString("vi-VN")}`}
      subtitle={`Mode: ${session.mode} • ${session.memberIds.length} thành viên • ${session.courtCount ?? 1} sân`}
    >
      <div className="space-y-4">
        <SectionCard title="Thông tin session">
          <div className="grid gap-3 md:grid-cols-4">
            <SummaryBox label="Ngày chơi" value={session.date} />
            <SummaryBox label="Mode" value={session.mode} />
            <SummaryBox label="Điểm thắng" value={session.pointToWin} />
            <SummaryBox label="Số sân" value={session.courtCount ?? 1} />
          </div>
        </SectionCard>

        <SectionCard title="Thành viên tham gia">
          <div className="flex flex-wrap gap-2">
            {session.memberIds.map((memberId) => {
              const member = memberMap.get(memberId);

              return (
                <span
                  key={memberId}
                  className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  {member?.name ?? memberId}
                </span>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Lịch đấu">
          {schedule.rounds.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Chưa thể tạo lịch đấu. Cần đủ số thành viên hợp lệ.
            </div>
          ) : (
            <div className="space-y-5">
              {schedule.rounds.map((round) => (
                <div
                  key={round.round}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-base font-bold text-slate-900">
                      Round {round.round}
                    </div>

                    {round.restingMemberIds.length > 0 ? (
                      <div className="text-sm text-slate-500">
                        Nghỉ:{" "}
                        <span className="font-medium text-slate-700">
                          {round.restingMemberIds
                            .map((id) => memberMap.get(id)?.name ?? id)
                            .join(", ")}
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">
                        Không có người nghỉ
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {round.matches.map((scheduledMatch) => {
                      const savedMatch = findSavedMatch(scheduledMatch);

                      const match: MatchRecord =
                        savedMatch ??
                        {
                          id: `${session.id}_${scheduledMatch.round}_${scheduledMatch.court}`,
                          sessionId: session.id,
                          round: scheduledMatch.round,
                          court: scheduledMatch.court,
                          teamA: {
                            memberIds: scheduledMatch.teamAMemberIds,
                          },
                          teamB: {
                            memberIds: scheduledMatch.teamBMemberIds,
                          },
                          scoreA: 0,
                          scoreB: 0,
                          createdAt: new Date().toISOString(),
                        };

                      return (
                        <SessionMatchCard
                          key={`${scheduledMatch.round}-${scheduledMatch.court}-${scheduledMatch.teamAMemberIds.join("_")}-${scheduledMatch.teamBMemberIds.join("_")}`}
                          match={match}
                          memberMap={memberMap}
                          onSaveScore={handleSaveScore}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
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
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-lg font-bold text-slate-900">{value}</div>
    </div>
  );
}

function sameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;

  const aa = [...a].sort();
  const bb = [...b].sort();

  return aa.every((id, index) => id === bb[index]);
}
