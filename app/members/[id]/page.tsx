"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Swords, Trophy, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import type { MatchRecord, Player, SessionRecord } from "@/types";
import { getMatches, getPlayers, getSessions } from "@/lib/storage";
import { getPlayerDetailStats } from "@/lib/ranking";

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const playerId = params?.id;

  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPlayers(getPlayers());
    setMatches(getMatches());
    setSessions(getSessions());
    setLoaded(true);
  }, []);

  const player = useMemo(() => {
    return players.find((p) => p.id === playerId) ?? null;
  }, [players, playerId]);

  const sessionDateMap = useMemo(() => {
    const map: Record<string, string> = {};
    sessions.forEach((s) => {
      map[s.id] = s.date;
    });
    return map;
  }, [sessions]);

  const detail = useMemo(() => {
    if (!playerId) return null;
    return getPlayerDetailStats(playerId, players, matches, sessionDateMap);
  }, [playerId, players, matches, sessionDateMap]);

  if (!loaded) {
    return (
      <AppShell title="Hồ sơ thành viên" subtitle="Đang tải dữ liệu...">
        <div className="rounded-3xl bg-white p-6 shadow-card">Đang tải...</div>
      </AppShell>
    );
  }

  if (!player || !detail) {
    return (
      <AppShell title="Hồ sơ thành viên" subtitle="Không tìm thấy thành viên">
        <SectionCard title="Không tìm thấy thành viên">
          <div className="space-y-3">
            <div className="text-sm text-slate-600">
              Thành viên này không tồn tại hoặc đã bị xoá.
            </div>
            <Link
              href="/members"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
            >
              <ArrowLeft size={16} />
              Quay lại danh sách thành viên
            </Link>
          </div>
        </SectionCard>
      </AppShell>
    );
  }

  const { summary, favoritePartners, commonOpponents, history } = detail;

  return (
    <AppShell
      title={player.name}
      subtitle={player.nickname?.trim() ? player.nickname : "Hồ sơ thành viên"}
    >
      <div className="space-y-4">
        <SectionCard
          title="Tổng quan"
          action={
            <Link
              href="/members"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
            >
              <ArrowLeft size={16} />
              Quay lại
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Tổng trận</div>
              <div className="mt-2 text-2xl font-bold">{summary.matches}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Win rate</div>
              <div className="mt-2 text-2xl font-bold">{summary.winRate}%</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Thắng / Thua</div>
              <div className="mt-2 text-lg font-bold">
                {summary.wins} / {summary.losses}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Hiệu số</div>
              <div className="mt-2 text-lg font-bold">{summary.pointDiff}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Điểm ghi được</div>
              <div className="mt-2 text-xl font-bold">{summary.pointsFor}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Điểm bị ghi</div>
              <div className="mt-2 text-xl font-bold">{summary.pointsAgainst}</div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Đồng đội đánh cùng nhiều nhất">
          {favoritePartners.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
              Chưa có dữ liệu đồng đội.
            </div>
          ) : (
            <div className="space-y-3">
              {favoritePartners.slice(0, 5).map((item, index) => (
                <div
                  key={item.playerId}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-bold text-slate-700">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-slate-500">Đồng đội</div>
                    </div>
                  </div>

                  <div className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
                    {item.count} trận
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Đối thủ gặp nhiều nhất">
          {commonOpponents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
              Chưa có dữ liệu đối thủ.
            </div>
          ) : (
            <div className="space-y-3">
              {commonOpponents.slice(0, 5).map((item, index) => (
                <div
                  key={item.playerId}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-bold text-slate-700">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-slate-500">Đối thủ</div>
                    </div>
                  </div>

                  <div className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
                    {item.count} trận
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Lịch sử trận đấu">
          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
              Thành viên này chưa có trận nào được lưu.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.matchId}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">
                        {item.date
                          ? new Date(item.date).toLocaleDateString("vi-VN")
                          : "Không rõ ngày"}{" "}
                        • Trận {item.round}
                      </div>
                      <div className="text-sm text-slate-500">
                        {item.result === "W"
                          ? "Thắng"
                          : item.result === "L"
                          ? "Thua"
                          : "Hoà"}
                      </div>
                    </div>

                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.result === "W"
                          ? "bg-green-100 text-green-700"
                          : item.result === "L"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {item.scoreFor} - {item.scoreAgainst}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="rounded-2xl bg-white p-3">
                      <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                        <Users size={14} />
                        Đội của bạn
                      </div>
                      <div className="font-medium">{item.teamLabel}</div>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                        <Swords size={14} />
                        Đối thủ
                      </div>
                      <div className="font-medium">{item.opponentLabel}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Ghi chú Sprint 4 - Phase 2">
          <div className="space-y-2 text-sm text-slate-600">
            <div>• Hồ sơ thành viên đang được tính hoàn toàn từ match đã lưu.</div>
            <div>• Đồng đội và đối thủ được thống kê theo số lần xuất hiện cùng / đối đầu.</div>
            <div>• Phase tiếp theo có thể bổ sung lọc theo 7 ngày, 30 ngày, từng buổi chơi.</div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}