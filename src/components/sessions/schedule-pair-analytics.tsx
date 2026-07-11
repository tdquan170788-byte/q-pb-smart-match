import { Repeat2, Shield, Swords } from "lucide-react";

import type {
  Member,
  SchedulePairStat,
} from "@/types";

import Avatar from "@/components/ui/avatar";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";

type PairMode = "teammate" | "opponent";

type Props = {
  mode: PairMode;
  pairStats: SchedulePairStat[];
  memberMap: Map<string, Member>;
  limit?: number;
};

type PairAnalyticsRow = SchedulePairStat & {
  firstMemberName: string;
  secondMemberName: string;
};

export default function SchedulePairAnalytics({
  mode,
  pairStats,
  memberMap,
  limit = 10,
}: Props) {
  const rows = buildPairAnalyticsRows({
    pairStats,
    memberMap,
    limit,
  });

  const presentation = getPairModePresentation(mode);

  if (rows.length === 0) {
    return (
      <Card className="shadow-none">
        <div className="py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            {presentation.icon}
          </div>

          <div className="mt-3 font-semibold text-slate-900">
            Chưa có dữ liệu
          </div>

          <div className="mt-1 text-sm text-slate-500">
            Chưa ghi nhận cặp {presentation.emptyLabel}.
          </div>
        </div>
      </Card>
    );
  }

  const repeatedRows = rows.filter((row) => row.count > 1);
  const maximumRepeatCount = Math.max(
    ...rows.map((row) => row.count),
    0
  );

  const totalExtraRepeatCount = rows.reduce(
    (sum, row) => sum + Math.max(0, row.count - 1),
    0
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <PairSummaryBox
          label="Số cặp"
          value={rows.length}
          icon={presentation.icon}
        />

        <PairSummaryBox
          label="Cặp bị lặp"
          value={repeatedRows.length}
          icon={<Repeat2 size={17} />}
        />

        <PairSummaryBox
          label="Lặp cao nhất"
          value={maximumRepeatCount}
          icon={
            mode === "teammate" ? (
              <Shield size={17} />
            ) : (
              <Swords size={17} />
            )
          }
        />
      </div>

      {totalExtraRepeatCount > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Có tổng cộng{" "}
          <span className="font-bold">
            {totalExtraRepeatCount}
          </span>{" "}
          lượt lặp thêm trong nhóm thống kê này.
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Không có cặp nào bị lặp trong nhóm thống kê này.
        </div>
      )}

      <div className="space-y-3">
        {rows.map((row, index) => {
          const repeatPresentation = getRepeatPresentation({
            mode,
            count: row.count,
          });

          return (
            <Card
              key={row.pairKey}
              className="shadow-none"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar name={row.firstMemberName} />

                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900">
                          {row.firstMemberName}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {mode === "teammate"
                            ? "Đồng đội"
                            : "Đối thủ"}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-center gap-1 text-slate-400">
                      {mode === "teammate" ? (
                        <Shield size={18} />
                      ) : (
                        <Swords size={18} />
                      )}

                      <span className="text-[10px] font-semibold uppercase tracking-wide">
                        {mode === "teammate" ? "Cùng đội" : "Đối đầu"}
                      </span>
                    </div>

                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar name={row.secondMemberName} />

                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900">
                          {row.secondMemberName}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {mode === "teammate"
                            ? "Đồng đội"
                            : "Đối thủ"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <div>
                      <div className="text-xs text-slate-500">
                        Số lần {presentation.actionLabel}
                      </div>

                      <div className="mt-1 text-xl font-bold text-slate-900">
                        {row.count}
                      </div>
                    </div>

                    <Badge variant={repeatPresentation.variant}>
                      {repeatPresentation.label}
                    </Badge>
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

function PairSummaryBox({
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

function buildPairAnalyticsRows({
  pairStats,
  memberMap,
  limit,
}: {
  pairStats: SchedulePairStat[];
  memberMap: Map<string, Member>;
  limit: number;
}): PairAnalyticsRow[] {
  return [...pairStats]
    .sort((firstRow, secondRow) => {
      if (secondRow.count !== firstRow.count) {
        return secondRow.count - firstRow.count;
      }

      return firstRow.pairKey.localeCompare(
        secondRow.pairKey
      );
    })
    .slice(0, Math.max(1, limit))
    .map((row) => ({
      ...row,
      firstMemberName:
        memberMap.get(row.firstMemberId)?.name ??
        row.firstMemberId,
      secondMemberName:
        memberMap.get(row.secondMemberId)?.name ??
        row.secondMemberId,
    }));
}

function getPairModePresentation(mode: PairMode): {
  icon: React.ReactNode;
  emptyLabel: string;
  actionLabel: string;
} {
  if (mode === "teammate") {
    return {
      icon: <Shield size={19} />,
      emptyLabel: "đồng đội",
      actionLabel: "ghép cùng nhau",
    };
  }

  return {
    icon: <Swords size={19} />,
    emptyLabel: "đối thủ",
    actionLabel: "đối đầu",
  };
}

function getRepeatPresentation({
  mode,
  count,
}: {
  mode: PairMode;
  count: number;
}): {
  label: string;
  variant: "success" | "info" | "warning" | "danger";
} {
  if (count <= 1) {
    return {
      label: "Không lặp",
      variant: "success",
    };
  }

  if (count === 2) {
    return {
      label: "Lặp nhẹ",
      variant: "info",
    };
  }

  if (mode === "opponent" && count === 3) {
    return {
      label: "Chấp nhận được",
      variant: "warning",
    };
  }

  if (mode === "teammate" && count === 3) {
    return {
      label: "Lặp nhiều",
      variant: "warning",
    };
  }

  return {
    label: "Cần tối ưu",
    variant: "danger",
  };
}
