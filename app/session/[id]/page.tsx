"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Trophy, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import { getMatchesBySession, getPlayers, getSessionById } from "@/lib/storage";
import type { MatchRecord, Player, SessionRecord } from "@/types";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function SessionDetailPage({ params }: PageProps) {
  const [sessionId, setSessionId] = useState<string>("");
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const resolved = await params;
      if (!mounted) return;

      const id = resolved.id;
      setSessionId(id);
      setSession(getSessionById(id));
      setMatches(getMatchesBySession(id));
      setPlayers(getPlayers());
      setReady(true);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [params]);

  const participantNames = useMemo(() => {
    if (!session) return [];
    return session.participantIds.map(
      (id) => players.find((p) => p.id === id)?.name ?? "Unknown"
    );
  }, [players, session]);

  function getPlayerNames(ids: string[]) {
    return ids
      .map((id) => players.find((p) => p.id === id)?.name ?? "Unknown")
      .join(" / ");
  }

  if (!ready) {
    return (
      <AppShell title="Chi tiết buổi chơi" subtitle="Đang tải dữ liệu">
        <div className="rounded-3xl bg-white p-5 shadow-card">Đang tải...</div>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell title="Chi tiết buổi chơi" subtitle="Không tìm thấy session">
        <SectionCard title="Không tìm thấy">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Buổi chơi này không tồn tại hoặc đã bị xoá.
            </p>
            <Link
              href="/session"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
            >
              <ArrowLeft size={16} />
              Quay lại danh sách session
            </Link>
          </div>
        </SectionCard>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Session ${new Date(session.date).toLocaleDateString("vi-VN")}`}
      subtitle="Chi tiết buổi chơi"
    >
      <div className="space-y-4">
        <Link
          href="/session"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách
        </Link>

        <SectionCard title="Thông tin buổi chơi">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays size={16} />
                Ngày chơi
              </div>
              <div className="mt-2 text-xl font-bold">
                {new Date(session.date).toLocaleDateString("vi-VN")}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Trophy size={16} />
                Chạm đích
              </div>
              <div className="mt-2 text-2xl font-bold">{session.pointToWin}</div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={`Người tham gia (${session.participantIds.length})`}>
          <div className="flex flex-wrap gap-2">
            {participantNames.map((name, index) => (
              <span
                key={`${sessionId}_${index}_${name}`}
                className="rounded-full bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700"
              >
                {name}
              </span>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={`Lịch sử trận trong session (${matches.length})`}>
          {matches.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              Session này chưa có trận nào được lưu.
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-800">
                        Round {match.round}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {getPlayerNames(match.teamA.playerIds)}
                      </div>
                      <div className="text-xs text-slate-400">vs</div>
                      <div className="text-sm text-slate-600">
                        {getPlayerNames(match.teamB.playerIds)}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-800">
                      {match.scoreA} - {match.scoreB}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Đi tiếp ở Sprint sau">
          <div className="space-y-2 text-sm text-slate-600">
            <div>• Thêm nút “Xếp cặp round mới” ngay trong session này.</div>
            <div>• Lưu kết quả trận và cập nhật ranking tự động.</div>
            <div>• Hiển thị lịch sử round rõ hơn theo từng vòng.</div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}