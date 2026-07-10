"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, RotateCcw, Trash2, Users } from "lucide-react";

import AppShell from "@/components/app-shell";
import ConfirmDialog from "@/components/confirm-dialog";
import MemberFormSheet from "@/components/member-form-sheet";
import SectionCard from "@/components/section-card";

import type { Member, MemberForm } from "@/types";
import {
  createMember,
  deleteMember,
  ensureSeedData,
  getMembers,
  resetSeedMembers,
  updateMember,
} from "@/lib/storage";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    ensureSeedData();
    setMembers(getMembers());
    setLoaded(true);
  }, []);

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [members]);

  function refreshMembers() {
    setMembers(getMembers());
  }

  function openCreate() {
    setEditingMember(null);
    setSheetMode("create");
    setSheetOpen(true);
  }

  function openEdit(member: Member) {
    setEditingMember(member);
    setSheetMode("edit");
    setSheetOpen(true);
  }

  function handleSubmit(form: MemberForm) {
    if (!form.name.trim()) return;

    if (sheetMode === "create") {
      createMember({
        name: form.name,
        nickname: form.nickname,
      });
    } else if (editingMember) {
      updateMember(editingMember.id, {
        name: form.name,
        nickname: form.nickname,
      });
    }

    refreshMembers();
    setSheetOpen(false);
    setEditingMember(null);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;

    deleteMember(deleteTarget.id);
    refreshMembers();
    setDeleteTarget(null);
  }

  function handleResetSeed() {
    resetSeedMembers();
    refreshMembers();
    setResetOpen(false);
  }

  return (
    <AppShell
      title="Thành viên"
      subtitle="Quản lý danh sách người chơi cho Q-PB Smart Match"
    >
      <div className="space-y-4">
        <SectionCard
          title="Tổng quan thành viên"
          action={
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Thêm
            </button>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Số thành viên</div>
              <div className="mt-2 text-3xl font-bold">{members.length}</div>
              <div className="mt-1 text-xs text-slate-400">
                Dùng cho xếp cặp và thống kê
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Dữ liệu hiện tại</div>
              <div className="mt-2 text-lg font-bold">
                {loaded ? "Đã tải" : "Đang tải..."}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Lưu cục bộ trên thiết bị
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={openCreate}
              className="flex-1 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
            >
              + Thêm thành viên
            </button>

            <button
              onClick={() => setResetOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700"
            >
              <RotateCcw size={16} />
              Seed lại
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Danh sách thành viên">
          {sortedMembers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Users className="text-slate-500" size={22} />
              </div>
              <div className="text-base font-semibold">Chưa có thành viên</div>
              <div className="mt-1 text-sm text-slate-500">
                Hãy thêm người chơi đầu tiên cho nhóm pickleball của bạn.
              </div>
              <button
                onClick={openCreate}
                className="mt-4 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
              >
                Thêm thành viên đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedMembers.map((member, index) => (
                <div
                  key={member.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/members/${member.id}`}
                      className="min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                          {index + 1}
                        </div>

                        <div>
                          <div className="text-base font-semibold">
                            {member.name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {member.nickname?.trim()
                              ? `Biệt danh: ${member.nickname}`
                              : "Chưa có biệt danh"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                        <div className="rounded-xl bg-white px-3 py-2 text-slate-600">
                          Normal — Rating: {member.ratingNormal} • W:{" "}
                          {member.winsNormal} • L: {member.lossesNormal} • M:{" "}
                          {member.matchesNormal}
                        </div>

                        <div className="rounded-xl bg-white px-3 py-2 text-slate-600">
                          Team — Rating: {member.ratingTeam} • W:{" "}
                          {member.winsTeam} • L: {member.lossesTeam} • M:{" "}
                          {member.matchesTeam}
                        </div>
                      </div>
                    </Link>

                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => openEdit(member)}
                        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700"
                        aria-label={`Sửa ${member.name}`}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => setDeleteTarget(member)}
                        className="rounded-xl border border-red-200 bg-white p-2 text-red-600"
                        aria-label={`Xóa ${member.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Ghi chú">
          <div className="space-y-2 text-sm text-slate-600">
            <div>
              • Dữ liệu thành viên đang lưu bằng localStorage trên máy hiện tại.
            </div>
            <div>• Bấm vào từng thành viên để xem thống kê chi tiết.</div>
            <div>• Có thể reset lại 8 người mẫu bất cứ lúc nào.</div>
          </div>
        </SectionCard>
      </div>

      <MemberFormSheet
        open={sheetOpen}
        mode={sheetMode}
        member={editingMember}
        onClose={() => {
          setSheetOpen(false);
          setEditingMember(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá thành viên?"
        description={
          deleteTarget
            ? `Bạn có chắc muốn xoá ${deleteTarget.name} khỏi danh sách thành viên không?`
            : ""
        }
        confirmText="Xoá"
        cancelText="Huỷ"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmDialog
        open={resetOpen}
        title="Seed lại dữ liệu mẫu?"
        description="Thao tác này sẽ thay toàn bộ danh sách hiện tại bằng 8 thành viên mẫu ban đầu."
        confirmText="Seed lại"
        cancelText="Huỷ"
        onCancel={() => setResetOpen(false)}
        onConfirm={handleResetSeed}
      />
    </AppShell>
  );
}
