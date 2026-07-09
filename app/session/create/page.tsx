"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import SessionCreateForm from "@/components/sessions/session-create-form";
import { createSession, ensureSeedData, getPlayers } from "@/lib/storage";
import type { Player, SessionMode } from "@/types";

export default function SessionCreatePage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    ensureSeedData();
    setPlayers(getPlayers());
  }, []);

  function handleCreate(payload: {
    date: string;
    pointToWin: number;
    participantIds: string[];
    mode: SessionMode;
    courtCount: number;
  }) {
    const session = createSession({
      date: payload.date,
      pointToWin: payload.pointToWin,
      participantIds: payload.participantIds,
      mode: payload.mode,
      courtCount: payload.courtCount,
    });

    router.push(`/sessions/${session.id}`);
  }

  return (
    <AppShell title="Tạo session" subtitle="Khởi tạo buổi chơi mới">
      <SectionCard title="Thông tin session">
        <SessionCreateForm players={players} onSubmit={handleCreate} />
      </SectionCard>
    </AppShell>
  );
}