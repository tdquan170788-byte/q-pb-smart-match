"use client";

import { useEffect, useState } from "react";
import type { Player, PlayerForm } from "@/types";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  player?: Player | null;
  onClose: () => void;
  onSubmit: (value: PlayerForm) => void;
};

const emptyForm: PlayerForm = {
  name: "",
  nickname: "",
};

export default function PlayerFormSheet({
  open,
  mode,
  player,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<PlayerForm>(emptyForm);

  useEffect(() => {
    if (mode === "edit" && player) {
      setForm({
        name: player.name,
        nickname: player.nickname || "",
      });
      return;
    }

    setForm(emptyForm);
  }, [mode, player, open]);

  if (!open) return null;

  const title = mode === "create" ? "Thêm thành viên" : "Sửa thành viên";

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-900/40">
      <div className="w-full rounded-t-[28px] bg-white p-4 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-500"
          >
            Đóng
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Tên hiển thị *
            </label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Ví dụ: Quân"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Biệt danh
            </label>
            <input
              value={form.nickname}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nickname: e.target.value }))
              }
              placeholder="Ví dụ: QD"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
            />
          </div>

          <button
            onClick={() => onSubmit(form)}
            disabled={!form.name.trim()}
            className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {mode === "create" ? "Lưu thành viên" : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}