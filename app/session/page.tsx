"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import StatCard from "@/components/stat-card";
import {
  createSession,
  ensureSeedData,
  getMatches,
  getPlayers,
  getSessions,
} from "@/lib/storage";

export default function SessionPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    ensureSeedData();
    setRefreshKey((v) => v + 1);
  }, []);

  const data = useMemo(() => {
    const players = getPlayers();
    const sessions = getSessions();
    const matches = getMatches();

    return {
      players,
      sessions,
      matches,
    };
  }, [refreshKey]);

  function handleCreateQuickSession() {
    if (data.players.length < 4) {
      alert("Cần ít nhất 4 người để tạo session.");
      return;
    }

    const participantIds = data.players.slice(0, 8).map((p) => p.id);

    createSession({
      date: new Date().toISOString().slice(0, 10),
      pointToWin: 11,
      participantIds,
      mode: "normal",
      courtCount: 1,
    });

    setRefreshKey((v) => v + 1);
  }

  return (
    <AppShell title="Session" subtitle="Tạo buổi chơi và quản lý kết quả">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Tổng session"
            value={data.sessions.length}
            hint="Số buổi đã tạo"
          />
          <StatCard
            label="Tổng trận"
            value={data.matches.length}
            hint="Đã lưu kết quả"
          />
        </div>

        <SectionCard
          title="Tạo nhanh"
          action={
            <button
              onClick={handleCreateQuickSession}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Tạo nhanh
            </button>
          }
        >
          <div className="space-y-3 text-sm text-slate-600">
            <div>
              Nút này sẽ tạo 1 session normal 11 điểm với tối đa 8 người đầu tiên
              trong danh sách thành viên.
            </div>
            <button
              onClick={handleCreateQuickSession}
              className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
            >
              Tạo session mẫu
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Danh sách session">
          {data.sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <CalendarDays className="text-slate-500" size={22} />
              </div>
              <div className="text-base font-semibold">Chưa có session nào</div>
              <div className="mt-1 text-sm text-slate-500">
                Hãy tạo session đầu tiên để bắt đầu ghi trận.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {data.sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/session/${session.id}`}
                  className="block rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {session.date}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        Mode: {session.mode ?? "normal"} • {session.pointToWin} điểm
                      </div>
                    </div>

                    <div className="text-right text-sm text-slate-500">
                      <div>{session.participantIds.length} người</div>
                      <div>{session.courtCount ?? 1} sân</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}