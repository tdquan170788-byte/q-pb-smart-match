"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";
import RoundRecommendationPanel from "@/components/sessions/round-recommendation-panel";

import type {
  Member,
  SessionMode,
  RoundPlanningConfig,
} from "@/types";

import {
  ensureSeedData,
  getMembers,
} from "@/lib/storage";

import { createFrozenSession } from "@/lib/sessions/session-service";

type RoundSelectionSource =
  | "automatic"
  | "manual"
  | "recommendation";

function todayInputValue(): string {
  const date = new Date();

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function NewSessionPage() {
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);

  const [date, setDate] = useState(todayInputValue());
  const [mode, setMode] = useState<SessionMode>("normal");
  const [pointToWin, setPointToWin] = useState(11);
  const [courtCount, setCourtCount] = useState(1);

  const [useAutomaticRounds, setUseAutomaticRounds] =
    useState(true);

  const [targetRounds, setTargetRounds] = useState(6);

  const [
    roundSelectionSource,
    setRoundSelectionSource,
  ] = useState<RoundSelectionSource>("automatic");

const [planningMode, setPlanningMode] =
  useState<
    "coverage" | "time" | "smart" | "manual"
  >("coverage");

const [sessionMinutes, setSessionMinutes] =
  useState(90);

const [targetCoverage, setTargetCoverage] =
  useState(100);

  const [memberIds, setMemberIds] = useState<string[]>([]);

  const [teamAMemberIds, setTeamAMemberIds] =
    useState<string[]>([]);

  const [teamBMemberIds, setTeamBMemberIds] =
    useState<string[]>([]);

  useEffect(() => {
    ensureSeedData();
    setMembers(getMembers());
  }, []);

  const sortedMembers = useMemo(() => {
    return [...members].sort(
      (firstMember, secondMember) =>
        firstMember.name.localeCompare(
          secondMember.name,
          "vi"
        )
    );
  }, [members]);

  const memberIdSet = useMemo(
    () => new Set(memberIds),
    [memberIds]
  );

  const teamASet = useMemo(
    () => new Set(teamAMemberIds),
    [teamAMemberIds]
  );

  const teamBSet = useMemo(
    () => new Set(teamBMemberIds),
    [teamBMemberIds]
  );

  const sessionTeamConfig = useMemo(() => {
    if (mode !== "team") {
      return undefined;
    }

    return {
      teamAMemberIds: [...teamAMemberIds],
      teamBMemberIds: [...teamBMemberIds],
    };
  }, [
    mode,
    teamAMemberIds,
    teamBMemberIds,
  ]);

const roundPlanning =
  useMemo<RoundPlanningConfig>(() => {
    switch (planningMode) {
      case "manual":
        return {
          mode: "manual",
          manualRoundCount: targetRounds,
        };

      case "time":
        return {
          mode: "time",
          sessionMinutes,
        };

      case "smart":
        return {
          mode: "smart",
        };

      default:
        return {
          mode: "coverage",
          targetCoverage,
        };
    }
  }, [
    planningMode,
    targetRounds,
    sessionMinutes,
    targetCoverage,
  ]);

  const unassignedTeamMemberIds = useMemo(() => {
    if (mode !== "team") {
      return [];
    }

    return memberIds.filter(
      (memberId) =>
        !teamASet.has(memberId) &&
        !teamBSet.has(memberId)
    );
  }, [
    mode,
    memberIds,
    teamASet,
    teamBSet,
  ]);

  const estimatedAutomaticRounds = useMemo(() => {
    if (memberIds.length < 4) {
      return 0;
    }

    if (mode === "team") {
      return Math.max(
        teamAMemberIds.length,
        teamBMemberIds.length
      );
    }

    return Math.max(
      1,
      memberIds.length - 1
    );
  }, [
    mode,
    memberIds.length,
    teamAMemberIds.length,
    teamBMemberIds.length,
  ]);

  const roundSelectionLabel = useMemo(() => {
    if (roundSelectionSource === "recommendation") {
      return "Đề xuất";
    }

    if (roundSelectionSource === "manual") {
      return "Nhập thủ công";
    }

    return "Tự động";
  }, [roundSelectionSource]);

  function toggleMember(memberId: string): void {
    setMemberIds((previousMemberIds) => {
      if (previousMemberIds.includes(memberId)) {
        setTeamAMemberIds(
          (previousTeamMemberIds) =>
            previousTeamMemberIds.filter(
              (currentMemberId) =>
                currentMemberId !== memberId
            )
        );

        setTeamBMemberIds(
          (previousTeamMemberIds) =>
            previousTeamMemberIds.filter(
              (currentMemberId) =>
                currentMemberId !== memberId
            )
        );

        return previousMemberIds.filter(
          (currentMemberId) =>
            currentMemberId !== memberId
        );
      }

      return [
        ...previousMemberIds,
        memberId,
      ];
    });
  }

  function assignToTeamA(
    memberId: string
  ): void {
    if (!memberIdSet.has(memberId)) {
      return;
    }

    setTeamBMemberIds(
      (previousTeamMemberIds) =>
        previousTeamMemberIds.filter(
          (currentMemberId) =>
            currentMemberId !== memberId
        )
    );

    setTeamAMemberIds(
      (previousTeamMemberIds) => {
        if (
          previousTeamMemberIds.includes(
            memberId
          )
        ) {
          return previousTeamMemberIds.filter(
            (currentMemberId) =>
              currentMemberId !== memberId
          );
        }

        return [
          ...previousTeamMemberIds,
          memberId,
        ];
      }
    );
  }

  function assignToTeamB(
    memberId: string
  ): void {
    if (!memberIdSet.has(memberId)) {
      return;
    }

    setTeamAMemberIds(
      (previousTeamMemberIds) =>
        previousTeamMemberIds.filter(
          (currentMemberId) =>
            currentMemberId !== memberId
        )
    );

    setTeamBMemberIds(
      (previousTeamMemberIds) => {
        if (
          previousTeamMemberIds.includes(
            memberId
          )
        ) {
          return previousTeamMemberIds.filter(
            (currentMemberId) =>
              currentMemberId !== memberId
          );
        }

        return [
          ...previousTeamMemberIds,
          memberId,
        ];
      }
    );
  }

  function fillTeamFromMembers(): void {
    const selectedMemberIds = [
      ...memberIds,
    ];

    const halfIndex = Math.ceil(
      selectedMemberIds.length / 2
    );

    setTeamAMemberIds(
      selectedMemberIds.slice(
        0,
        halfIndex
      )
    );

    setTeamBMemberIds(
      selectedMemberIds.slice(
        halfIndex
      )
    );
  }

  function handleUseCoveragePlanning(): void {
  setPlanningMode("coverage");
  setUseAutomaticRounds(true);
  setRoundSelectionSource("automatic");
}

function handleUseTimePlanning(): void {
  setPlanningMode("time");
  setUseAutomaticRounds(true);
  setRoundSelectionSource("automatic");
}

function handleUseSmartPlanning(): void {
  setPlanningMode("smart");
  setUseAutomaticRounds(true);
  setRoundSelectionSource("automatic");
}

function handleUseManualPlanning(): void {
  setPlanningMode("manual");
  setUseAutomaticRounds(false);
  setRoundSelectionSource("manual");
}

  function handleManualRoundChange(
    value: string
  ): void {
    const parsedValue =
      Number(value) || 1;

    setTargetRounds(parsedValue);
setPlanningMode("manual");
    setUseAutomaticRounds(false);
    setRoundSelectionSource("manual");
  }

  function handleSelectRecommendedRound(
    roundCount: number
  ): void {
    setTargetRounds(roundCount);
setPlanningMode("manual");
    setUseAutomaticRounds(false);
    setRoundSelectionSource(
      "recommendation"
    );
  }

  function validateBeforeSubmit(): boolean {
    if (!date) {
      alert("Vui lòng chọn ngày chơi.");
      return false;
    }

    if (
      !Number.isFinite(pointToWin) ||
      !Number.isInteger(pointToWin) ||
      pointToWin <= 0
    ) {
      alert(
        "Điểm chạm thắng phải là số nguyên lớn hơn 0."
      );

      return false;
    }

    if (
      !Number.isFinite(courtCount) ||
      !Number.isInteger(courtCount) ||
      courtCount <= 0
    ) {
      alert(
        "Số sân phải là số nguyên lớn hơn 0."
      );

      return false;
    }

    if (!useAutomaticRounds) {
      if (
        !Number.isFinite(targetRounds) ||
        !Number.isInteger(targetRounds) ||
        targetRounds <= 0
      ) {
        alert(
          "Số round phải là số nguyên lớn hơn 0."
        );

        return false;
      }

      if (targetRounds > 100) {
        alert(
          "Số round tối đa hiện tại là 100."
        );

        return false;
      }
    }

    if (memberIds.length < 4) {
      alert(
        "Cần ít nhất 4 thành viên để tạo session."
      );

      return false;
    }

    if (mode === "team") {
      if (
        teamAMemberIds.length < 2 ||
        teamBMemberIds.length < 2
      ) {
        alert(
          "Team mode cần ít nhất 2 thành viên trong mỗi đội."
        );

        return false;
      }

      const mergedTeamMemberIds = [
        ...teamAMemberIds,
        ...teamBMemberIds,
      ];

      const uniqueTeamMemberIds =
        new Set(mergedTeamMemberIds);

      if (
        uniqueTeamMemberIds.size !==
        mergedTeamMemberIds.length
      ) {
        alert(
          "Một thành viên không thể nằm ở cả hai đội."
        );

        return false;
      }

      const everySelectedMemberAssigned =
        memberIds.every((memberId) =>
          uniqueTeamMemberIds.has(
            memberId
          )
        );

      if (!everySelectedMemberAssigned) {
        alert(
          "Hãy chia đội cho tất cả thành viên đã chọn."
        );

        return false;
      }

      const allTeamMembersAreSelected =
        mergedTeamMemberIds.every(
          (memberId) =>
            memberIdSet.has(memberId)
        );

      if (!allTeamMembersAreSelected) {
        alert(
          "Có thành viên trong đội chưa được chọn ở danh sách tham gia."
        );

        return false;
      }
    }

    return true;
  }

  function handleCreateSession(): void {
    if (!validateBeforeSubmit()) {
      return;
    }

    const createdSession =
      createFrozenSession({
        date,

        pointToWin,

        memberIds: [
          ...memberIds,
        ],

        mode,

        courtCount,

roundPlanning,

targetRounds:
  useAutomaticRounds
    ? undefined
    : targetRounds,

teamConfig:
  sessionTeamConfig,
      });

    router.push(
      `/sessions/${createdSession.id}`
    );
  }

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
                onChange={(event) =>
                  setDate(
                    event.target.value
                  )
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </FieldBlock>

            <FieldBlock label="Mode">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setMode("normal")
                  }
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
                  onClick={() =>
                    setMode("team")
                  }
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
                step={1}
                value={pointToWin}
                onChange={(event) =>
                  setPointToWin(
                    Number(
                      event.target.value
                    ) || 11
                  )
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </FieldBlock>

            <FieldBlock label="Số sân">
              <input
                type="number"
                min={1}
                step={1}
                value={courtCount}
                onChange={(event) =>
                  setCourtCount(
                    Number(
                      event.target.value
                    ) || 1
                  )
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </FieldBlock>
          </div>
        </SectionCard>

        <SectionCard title="Số round">
       <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
  <button
    type="button"
    onClick={
      handleUseCoveragePlanning
    }
    className={`rounded-2xl border p-4 text-left transition ${
      planningMode === "coverage"
        ? "border-brand-500 bg-brand-50"
        : "border-slate-200 bg-white hover:bg-slate-50"
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-semibold text-slate-900">
          Coverage
        </div>

        <div className="mt-1 text-sm leading-6 text-slate-500">
          Tính số round theo mức độ bao phủ
          lượt chơi mong muốn.
        </div>
      </div>

      <SelectionBadge
        selected={
          planningMode === "coverage"
        }
      />
    </div>
  </button>

  <button
    type="button"
    onClick={
      handleUseTimePlanning
    }
    className={`rounded-2xl border p-4 text-left transition ${
      planningMode === "time"
        ? "border-brand-500 bg-brand-50"
        : "border-slate-200 bg-white hover:bg-slate-50"
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-semibold text-slate-900">
          Time
        </div>

        <div className="mt-1 text-sm leading-6 text-slate-500">
          Tính số round theo thời lượng
          buổi chơi.
        </div>
      </div>

      <SelectionBadge
        selected={
          planningMode === "time"
        }
      />
    </div>
  </button>

  <button
    type="button"
    onClick={
      handleUseSmartPlanning
    }
    className={`rounded-2xl border p-4 text-left transition ${
      planningMode === "smart"
        ? "border-brand-500 bg-brand-50"
        : "border-slate-200 bg-white hover:bg-slate-50"
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-semibold text-slate-900">
          Smart
        </div>

        <div className="mt-1 text-sm leading-6 text-slate-500">
          Tự chọn phương án phù hợp từ
          dữ liệu đã nhập.
        </div>
      </div>

      <SelectionBadge
        selected={
          planningMode === "smart"
        }
      />
    </div>
  </button>

  <button
    type="button"
    onClick={
      handleUseManualPlanning
    }
    className={`rounded-2xl border p-4 text-left transition ${
      planningMode === "manual"
        ? "border-brand-500 bg-brand-50"
        : "border-slate-200 bg-white hover:bg-slate-50"
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-semibold text-slate-900">
          Manual
        </div>

        <div className="mt-1 text-sm leading-6 text-slate-500">
          Nhập trực tiếp số round hoặc dùng
          Recommendation Engine.
        </div>
      </div>

      <SelectionBadge
        selected={
          planningMode === "manual"
        }
      />
    </div>
  </button>
</div>

         {planningMode === "coverage" ? (
  <div className="mt-4">
    <FieldBlock label="Target Coverage (%)">
      <input
        type="number"
        min={10}
        max={100}
        step={5}
        value={targetCoverage}
        onChange={(event) =>
          setTargetCoverage(
            Number(event.target.value) || 100
          )
        }
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
      />
    </FieldBlock>

    <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
      Scheduler sẽ tự tính số round để đạt khoảng{" "}
      <span className="font-semibold">
        {targetCoverage}%
      </span>{" "}
      mức độ bao phủ.
    </div>
  </div>
) : planningMode === "time" ? (
  <div className="mt-4">
    <FieldBlock label="Thời lượng buổi chơi (phút)">
      <input
        type="number"
        min={15}
        step={15}
        value={sessionMinutes}
        onChange={(event) =>
          setSessionMinutes(
            Number(event.target.value) || 90
          )
        }
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
      />
    </FieldBlock>

    <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
      Scheduler sẽ tính số round phù hợp với{" "}
      <span className="font-semibold">
        {sessionMinutes} phút
      </span>
      .
    </div>
  </div>
) : planningMode === "smart" ? (
  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
    Smart Mode sẽ tự lựa chọn giữa Coverage và
    Time dựa trên dữ liệu đã nhập.
  </div>
) : (
  <div className="mt-4">
    <FieldBlock label="Số round mong muốn">
      <input
        type="number"
        min={1}
        max={100}
        step={1}
        value={targetRounds}
        onChange={(event) =>
          handleManualRoundChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
      />
    </FieldBlock>

    <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
      Scheduler sẽ tạo đúng{" "}
      <span className="font-semibold text-slate-900">
        {targetRounds}
      </span>{" "}
      round.

      <span className="ml-1 font-semibold text-brand-700">
        Nguồn chọn: {roundSelectionLabel}.
      </span>
    </div>
  </div>
)}
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
          {sortedMembers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Chưa có thành viên để lựa chọn.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sortedMembers.map((member) => {
                const checked =
                  memberIdSet.has(member.id);

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() =>
                      toggleMember(
                        member.id
                      )
                    }
                    className={`rounded-2xl border p-4 text-left transition ${
                      checked
                        ? "border-brand-500 bg-brand-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900">
                          {member.name}
                        </div>

                        <div className="mt-1 truncate text-sm text-slate-500">
                          {member.nickname?.trim()
                            ? `Biệt danh: ${member.nickname}`
                            : "Chưa có biệt danh"}
                        </div>
                      </div>

                      <SelectionBadge
                        selected={checked}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>

        {mode === "team" ? (
          <SectionCard
            title="Chia đội"
            action={
              <button
                type="button"
                onClick={
                  fillTeamFromMembers
                }
                disabled={
                  memberIds.length === 0
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Chia nhanh 50/50
              </button>
            }
          >
            <div className="mb-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Chọn thành viên ở trên trước,
              sau đó đưa từng người vào{" "}
              <strong>Team A</strong> hoặc{" "}
              <strong>Team B</strong>.
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-base font-semibold text-slate-900">
                  Chưa vào đội
                </div>

                <div className="mt-3 space-y-3">
                  {unassignedTeamMemberIds.length ===
                  0 ? (
                    <div className="text-sm text-slate-500">
                      Không còn ai.
                    </div>
                  ) : (
                    unassignedTeamMemberIds.map(
                      (memberId) => {
                        const member =
                          members.find(
                            (item) =>
                              item.id ===
                              memberId
                          );

                        if (!member) {
                          return null;
                        }

                        return (
                          <div
                            key={
                              memberId
                            }
                            className="rounded-2xl border border-slate-200 p-3"
                          >
                            <div className="font-medium text-slate-900">
                              {
                                member.name
                              }
                            </div>

                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  assignToTeamA(
                                    memberId
                                  )
                                }
                                className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                              >
                                Vào Team A
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  assignToTeamB(
                                    memberId
                                  )
                                }
                                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                              >
                                Vào Team B
                              </button>
                            </div>
                          </div>
                        );
                      }
                    )
                  )}
                </div>
              </div>

              <TeamColumn
                title="Team A"
                memberIds={
                  teamAMemberIds
                }
                allMembers={members}
                onRemove={
                  assignToTeamA
                }
                onMoveToOther={
                  assignToTeamB
                }
              />

              <TeamColumn
                title="Team B"
                memberIds={
                  teamBMemberIds
                }
                allMembers={members}
                onRemove={
                  assignToTeamB
                }
                onMoveToOther={
                  assignToTeamA
                }
              />
            </div>
          </SectionCard>
        ) : null}

        <RoundRecommendationPanel
          memberIds={memberIds}
          mode={mode}
          courtCount={courtCount}
          pointToWin={pointToWin}
          teamConfig={sessionTeamConfig}
          selectedRoundCount={
            useAutomaticRounds
              ? undefined
              : targetRounds
          }
          onSelectRound={
            handleSelectRecommendedRound
          }
        />

        <SectionCard title="Tóm tắt session">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <SummaryBox
              label="Mode"
              value={
                mode === "team"
                  ? "Team"
                  : "Normal"
              }
            />

            <SummaryBox
              label="Thành viên"
              value={memberIds.length}
            />

            <SummaryBox
              label="Điểm thắng"
              value={pointToWin}
            />

            <SummaryBox
              label="Số sân"
              value={courtCount}
            />

            <SummaryBox
              label="Số round"
              value={
                useAutomaticRounds
                  ? estimatedAutomaticRounds >
                    0
                    ? estimatedAutomaticRounds
                    : "Tự động"
                  : targetRounds
              }
            />

            <SummaryBox
              label="Nguồn chọn round"
              value={roundSelectionLabel}
            />
          </div>

          {mode === "team" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TeamSummary
                title="Team A"
                memberIds={
                  teamAMemberIds
                }
                members={members}
              />

              <TeamSummary
                title="Team B"
                memberIds={
                  teamBMemberIds
                }
                members={members}
              />
            </div>
          ) : null}

          {roundSelectionSource ===
          "recommendation" ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
              Đã áp dụng phương án Recommendation Engine:
              <strong className="ml-1">
                {targetRounds} round
              </strong>
              .
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm leading-6 text-slate-700">
            Khi tạo session, lịch đấu sẽ
            được sinh và lưu cố định. Các
            thay đổi Scheduler trong tương
            lai sẽ không làm thay đổi lịch
            của session này.
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={
                handleCreateSession
              }
              className="rounded-2xl bg-brand-600 px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Tạo session và đóng băng lịch
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
      <div className="mb-2 text-sm font-medium text-slate-700">
        {label}
      </div>

      {children}
    </div>
  );
}

function SelectionBadge({
  selected,
}: {
  selected: boolean;
}) {
  return (
    <div
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
        selected
          ? "bg-brand-600 text-white"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {selected ? "Đã chọn" : "Chọn"}
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

      <div className="mt-2 text-xl font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function TeamSummary({
  title,
  memberIds,
  members,
}: {
  title: string;
  memberIds: string[];
  members: Member[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="font-semibold text-slate-900">
        {title}
      </div>

      <div className="mt-2 text-sm leading-6 text-slate-600">
        {memberIds.length > 0
          ? memberIds
              .map(
                (memberId) =>
                  members.find(
                    (member) =>
                      member.id ===
                      memberId
                  )?.name ?? memberId
              )
              .join(", ")
          : "Chưa có người"}
      </div>
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
  onRemove: (
    memberId: string
  ) => void;
  onMoveToOther: (
    memberId: string
  ) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-base font-semibold text-slate-900">
          {title}
        </div>

        <div className="text-sm text-slate-500">
          {memberIds.length} người
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {memberIds.length === 0 ? (
          <div className="text-sm text-slate-500">
            Chưa có người.
          </div>
        ) : (
          memberIds.map(
            (memberId) => {
              const member =
                allMembers.find(
                  (item) =>
                    item.id ===
                    memberId
                );

              if (!member) {
                return null;
              }

              return (
                <div
                  key={memberId}
                  className="rounded-2xl border border-slate-200 p-3"
                >
                  <div className="font-medium text-slate-900">
                    {member.name}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onRemove(
                          memberId
                        )
                      }
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                    >
                      Bỏ khỏi đội
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onMoveToOther(
                          memberId
                        )
                      }
                      className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Chuyển đội
                    </button>
                  </div>
                </div>
              );
            }
          )
        )}
      </div>
    </div>
  );
}
