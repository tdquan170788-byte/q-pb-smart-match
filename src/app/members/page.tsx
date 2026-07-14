"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  ChevronRight,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  UserRoundSearch,
  Users,
} from "lucide-react";

import AppShell from "@/components/app-shell";
import ConfirmDialog from "@/components/confirm-dialog";
import MemberFormSheet from "@/components/member-form-sheet";
import SectionCard from "@/components/section-card";

import type {
  Member,
  MemberForm,
} from "@/types";

import {
  createMember,
  deleteMember,
  ensureSeedData,
  getMembers,
  resetSeedMembers,
  updateMember,
} from "@/lib/storage";

export default function MembersPage() {
  const [
    members,
    setMembers,
  ] = useState<Member[]>([]);

  const [
    loaded,
    setLoaded,
  ] = useState(false);

  const [
    sheetOpen,
    setSheetOpen,
  ] = useState(false);

  const [
    sheetMode,
    setSheetMode,
  ] = useState<
    "create" | "edit"
  >("create");

  const [
    editingMember,
    setEditingMember,
  ] = useState<Member | null>(
    null
  );

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<Member | null>(
    null
  );

  const [
    resetOpen,
    setResetOpen,
  ] = useState(false);

  useEffect(() => {
    ensureSeedData();

    setMembers(
      getMembers()
    );

    setLoaded(true);
  }, []);

  const sortedMembers =
    useMemo(() => {
      return [
        ...members,
      ].sort(
        (
          firstMember,
          secondMember
        ) =>
          firstMember.name.localeCompare(
            secondMember.name,
            "vi"
          )
      );
    }, [members]);

  const activeMemberCount =
    useMemo(() => {
      return members.filter(
        (member) =>
          member.matches > 0
      ).length;
    }, [members]);

  function refreshMembers(): void {
    setMembers(
      getMembers()
    );
  }

  function openCreate(): void {
    setEditingMember(null);

    setSheetMode(
      "create"
    );

    setSheetOpen(true);
  }

  function openEdit(
    member: Member
  ): void {
    setEditingMember(
      member
    );

    setSheetMode(
      "edit"
    );

    setSheetOpen(true);
  }

  function handleSubmit(
    form: MemberForm
  ): void {
    if (!form.name.trim()) {
      return;
    }

    if (
      sheetMode === "create"
    ) {
      createMember({
        name:
          form.name,

        nickname:
          form.nickname,
      });
    } else if (
      editingMember
    ) {
      updateMember(
        editingMember.id,
        {
          name:
            form.name,

          nickname:
            form.nickname,
        }
      );
    }

    refreshMembers();

    setSheetOpen(false);

    setEditingMember(null);
  }

  function handleDeleteConfirm(): void {
    if (!deleteTarget) {
      return;
    }

    deleteMember(
      deleteTarget.id
    );

    refreshMembers();

    setDeleteTarget(null);
  }

  function handleResetSeed(): void {
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
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus size={16} />

              Thêm
            </button>
          }
        >
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <OverviewMetric
              label="Thành viên"
              value={
                members.length
              }
              description="Tổng số người chơi"
            />

            <OverviewMetric
              label="Đã thi đấu"
              value={
                activeMemberCount
              }
              description="Có ít nhất một trận"
            />

            <OverviewMetric
              label="Chưa thi đấu"
              value={Math.max(
                0,
                members.length -
                  activeMemberCount
              )}
              description="Chưa có kết quả"
            />

            <OverviewMetric
              label="Dữ liệu"
              value={
                loaded
                  ? "Đã tải"
                  : "Đang tải"
              }
              description="Lưu trên thiết bị"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openCreate}
              className="min-w-[170px] flex-1 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:opacity-90"
            >
              + Thêm thành viên
            </button>

            <button
              type="button"
              onClick={() =>
                setResetOpen(true)
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw
                size={16}
              />

              Seed lại
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="Danh sách thành viên"
          action={
            <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
              {sortedMembers.length} người
            </div>
          }
        >
          {sortedMembers.length ===
          0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Users
                  className="text-slate-500"
                  size={22}
                />
              </div>

              <div className="text-base font-semibold text-slate-900">
                Chưa có thành viên
              </div>

              <div className="mt-1 text-sm leading-6 text-slate-500">
                Hãy thêm người chơi đầu tiên
                cho nhóm pickleball của bạn.
              </div>

              <button
                type="button"
                onClick={openCreate}
                className="mt-4 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
              >
                Thêm thành viên đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedMembers.map(
                (
                  member,
                  index
                ) => (
                  <MemberListCard
                    key={
                      member.id
                    }
                    member={
                      member
                    }
                    index={
                      index
                    }
                    onEdit={() =>
                      openEdit(
                        member
                      )
                    }
                    onDelete={() =>
                      setDeleteTarget(
                        member
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Ghi chú">
          <div className="space-y-2 text-sm leading-6 text-slate-600">
            <div>
              • Dữ liệu thành viên đang lưu bằng
              localStorage trên thiết bị hiện tại.
            </div>

            <div>
              • Bấm vào tên hoặc nút Xem hồ sơ để
              mở Player Dashboard của thành viên.
            </div>

            <div>
              • Có thể seed lại 8 thành viên mẫu
              bất cứ lúc nào.
            </div>
          </div>
        </SectionCard>
      </div>

      <MemberFormSheet
        open={
          sheetOpen
        }
        mode={
          sheetMode
        }
        member={
          editingMember
        }
        onClose={() => {
          setSheetOpen(false);

          setEditingMember(null);
        }}
        onSubmit={
          handleSubmit
        }
      />

      <ConfirmDialog
        open={
          Boolean(
            deleteTarget
          )
        }
        title="Xoá thành viên?"
        description={
          deleteTarget
            ? `Bạn có chắc muốn xoá ${deleteTarget.name} khỏi danh sách thành viên không?`
            : ""
        }
        confirmText="Xoá"
        cancelText="Huỷ"
        danger
        onCancel={() =>
          setDeleteTarget(
            null
          )
        }
        onConfirm={
          handleDeleteConfirm
        }
      />

      <ConfirmDialog
        open={
          resetOpen
        }
        title="Seed lại dữ liệu mẫu?"
        description="Thao tác này sẽ thay toàn bộ danh sách hiện tại bằng 8 thành viên mẫu ban đầu."
        confirmText="Seed lại"
        cancelText="Huỷ"
        onCancel={() =>
          setResetOpen(false)
        }
        onConfirm={
          handleResetSeed
        }
      />
    </AppShell>
  );
}

function MemberListCard({
  member,
  index,
  onEdit,
  onDelete,
}: {
  member: Member;

  index: number;

  onEdit: () => void;

  onDelete: () => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/members/${member.id}`}
          className="min-w-0 flex-1"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {index + 1}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold text-slate-900">
                {member.name}
              </div>

              <div className="mt-1 truncate text-sm text-slate-500">
                {member.nickname?.trim()
                  ? `Biệt danh: ${member.nickname}`
                  : "Chưa có biệt danh"}
              </div>
            </div>

            <div className="hidden rounded-2xl bg-white px-3 py-2 text-right sm:block">
              <div className="text-[11px] text-slate-500">
                Overall
              </div>

              <div className="mt-1 font-bold text-slate-900">
                {Math.round(
                  member.rating
                ).toLocaleString(
                  "vi-VN"
                )}
              </div>
            </div>
          </div>
        </Link>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={
              onEdit
            }
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-100"
            aria-label={`Sửa ${member.name}`}
          >
            <Pencil
              size={16}
            />
          </button>

          <button
            type="button"
            onClick={
              onDelete
            }
            className="rounded-xl border border-red-200 bg-white p-2 text-red-600 transition hover:bg-red-50"
            aria-label={`Xóa ${member.name}`}
          >
            <Trash2
              size={16}
            />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
        <MemberMetric
          label="Normal Rating"
          value={Math.round(
            member.ratingNormal
          )}
        />

        <MemberMetric
          label="Normal W / L"
          value={`${member.winsNormal} / ${member.lossesNormal}`}
          description={`${member.matchesNormal} trận`}
        />

        <MemberMetric
          label="Team Rating"
          value={Math.round(
            member.ratingTeam
          )}
        />

        <MemberMetric
          label="Team W / L"
          value={`${member.winsTeam} / ${member.lossesTeam}`}
          description={`${member.matchesTeam} trận`}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
        <div className="text-xs text-slate-500">
          Tổng: {member.matches} trận •{" "}
          {member.wins} thắng •{" "}
          {member.losses} thua
        </div>

        <Link
          href={`/members/${member.id}`}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
        >
          <UserRoundSearch
            size={16}
          />

          <span className="hidden sm:inline">
            Xem hồ sơ
          </span>

          <ChevronRight
            size={16}
          />
        </Link>
      </div>
    </div>
  );
}

function OverviewMetric({
  label,
  value,
  description,
}: {
  label: string;

  value: string | number;

  description: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="text-sm text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </div>

      <div className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </div>
    </div>
  );
}

function MemberMetric({
  label,
  value,
  description,
}: {
  label: string;

  value: string | number;

  description?: string;
}) {
  return (
    <div className="rounded-xl bg-white px-3 py-3">
      <div className="text-[11px] text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-sm font-bold text-slate-900">
        {value}
      </div>

      {description ? (
        <div className="mt-1 text-[11px] text-slate-400">
          {description}
        </div>
      ) : null}
    </div>
  );
}
