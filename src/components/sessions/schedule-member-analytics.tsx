import { Activity, Coffee, Moon } from "lucide-react";

import type { Member, MemberScheduleStat } from "@/types";

import Avatar from "@/components/ui/avatar";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";

type Props = {
  memberStats: MemberScheduleStat[];
  memberMap: Map<string, Member>;
};

type MemberAnalyticsRow = MemberScheduleStat & {
  memberName: string;
  nickname: string;
};

export default function ScheduleMemberAnalytics({
  memberStats,
  memberMap,
}: Props) {
  const rows = buildMemberAnalyticsRows(memberStats, memberMap);

  if (rows.length === 0) {
    return (
      <Card className="shadow-none">
        <div className="py-8 text-center text-sm text-slate-500">
          Chưa có dữ liệu phân tích thành viên.
        </div>
      </Card>
    );
  }

  const highestMatchCount = Math.max(
    ...rows.map((row) => row.matchCount),
    0
  );

  const lowestMatchCount = Math.min(
    ...rows.map((row) => row.matchCount),
    0
  );

  const highestRestCount = Math.max(
    ...rows.map((row) => row.restCount),
    0
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <AnalyticsSummaryBox
          label="Nhiều trận nhất"
          value={highestMatchCount}
          icon={<Activity size={17} />}
        />

        <AnalyticsSummaryBox
          label="Ít trận nhất"
          value={lowestMatchCount}
          icon={<Coffee size={17} />}
        />

        <AnalyticsSummaryBox
          label="Nghỉ nhiều nhất"
          value={highestRestCount}
          icon={<Moon size={17} />}
        />
      </div>

      <div className="space-y-3">
        {rows.map((row) => {
          const restStatus = getRestStatus(
            row.maxConsecutiveRestCount
          );

          return (
            <Card
              key={row.memberId}
              className="shadow-none"
            >
              <div className="flex items-start gap-3">
                <Avatar name={row.memberName} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {row.memberName}
                      </div>

                      {row.nickname ? (
                        <div className="mt-1 text-xs text-slate-500">
                          Biệt danh: {row.nickname}
                        </div>
                      ) : null}
                    </div>

                    <Badge variant={restStatus.variant}>
                      {restStatus.label}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <MemberMetric
                      label="Trận"
                      value={row.matchCount}
                    />

                    <MemberMetric
                      label="Lượt nghỉ"
                      value={row.restCount}
                    />

                    <MemberMetric
                      label="Nghỉ liên tiếp"
                      value={row.maxConsecutiveRestCount}
                    />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function AnalyticsSummaryBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {icon}
        <span>{label}</span>
      </div>

      <div className="mt-2 text-xl font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function MemberMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-base font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function buildMemberAnalyticsRows(
  memberStats: MemberScheduleStat[],
  memberMap: Map<string, Member>
): MemberAnalyticsRow[] {
  return memberStats
    .map((stat) => {
      const member = memberMap.get(stat.memberId);

      return {
        ...stat,
        memberName: member?.name ?? stat.memberId,
        nickname: member?.nickname?.trim() ?? "",
      };
    })
    .sort((firstRow, secondRow) => {
      if (secondRow.matchCount !== firstRow.matchCount) {
        return secondRow.matchCount - firstRow.matchCount;
      }

      if (firstRow.restCount !== secondRow.restCount) {
        return firstRow.restCount - secondRow.restCount;
      }

      return firstRow.memberName.localeCompare(
        secondRow.memberName,
        "vi"
      );
    });
}

function getRestStatus(
  maxConsecutiveRestCount: number
): {
  label: string;
  variant: "success" | "info" | "warning" | "danger";
} {
  if (maxConsecutiveRestCount <= 1) {
    return {
      label: "Nghỉ hợp lý",
      variant: "success",
    };
  }

  if (maxConsecutiveRestCount === 2) {
    return {
      label: "Nghỉ 2 vòng",
      variant: "warning",
    };
  }

  return {
    label: "Cần cân bằng",
    variant: "danger",
  };
}
