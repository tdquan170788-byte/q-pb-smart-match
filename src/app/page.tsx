"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Swords, Trophy, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import StatCard from "@/components/stat-card";

import { ensureSeedData, getMatches, getMembers, getSessions } from "@/lib/storage";
import { rebuildRankingData } from "@/lib/ranking";

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    ensureSeedData();
    setRefreshKey((value) => value + 1);
  }, []);

  const stats = useMemo(() => {
    const members = getMembers();
    const sessions = getSessions();
    const matches = getMatches();

    const ranking = rebuildRankingData({
      members,
      sessions,
      matches,
    }).normalRows;

    return {
      totalMembers: members.length,
      totalSessions: sessions.length,
      totalMatches: matches.length,
      topMember: ranking[0] ?? null,
      recentSessions: sessions.slice(0, 5),
    };
  }, [refreshKey]);

  return (
    <AppShell title="Q-PB Smart Match" subtitle="Tổng quan hệ thống">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Thành viên"
            value={stats.totalMembers}
            hint="Danh sách người chơi"
          />

          <StatCard
            label="Buổi chơi"
            value={stats.totalSessions}
            hint="Tổng số session"
          />

          <StatCard
            label="Trận đấu"
            value={stats.totalMatches}
            hint="Đã ghi nhận"
          />

          <StatCard
            label="Top hiện tại"
            value={stats.topMember?.memberName ?? "--"}
            hint={
              stats.topMember
                ? `Thắng ${stats.topMember.wins} / ${stats.topMember.matches} trận`
                : "Chưa có dữ liệu"
            }
          />
        </div>

        <SectionCard
          title="Đi nhanh"
          action={
            <Link href="/sessions" className="text-sm font-medium text-brand-600">
              Tạo session
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/members"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Users size={16} />
                Thành viên
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Quản lý người chơi và nickname
              </p>
            </Link>

            <Link
              href="/sessions"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CalendarDays size={16} />
                Session
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Tạo lịch chơi và quản lý buổi đánh
              </p>
            </Link>

            <Link
              href="/ranking"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Trophy size={16} />
                BXH
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Xem xếp hạng và thống kê
              </p>
            </Link>

            <Link
              href="/sessions"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Swords size={16} />
                Ghi trận
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Chọn session để nhập kết quả
              </p>
            </Link>
          </div>
        </SectionCard>

        <SectionCard title="Buổi chơi gần đây">
          {stats.recentSessions.length === 0 ? (
            <div className="text-sm text-slate-500">Chưa có buổi chơi nào.</div>
          ) : (
            <div className="space-y-3">
              {stats.recentSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="block rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {session.date || "Không có ngày"}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        Chạm để xem chi tiết session
                      </div>
                    </div>

                    <div className="text-right text-sm text-slate-500">
                      <div>{session.memberIds.length} người</div>
                      <div>{session.pointToWin} điểm</div>
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
