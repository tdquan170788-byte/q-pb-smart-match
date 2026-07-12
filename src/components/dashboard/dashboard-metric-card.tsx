import type {
  ReactNode,
} from "react";

type DashboardMetricTone =
  | "default"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

type DashboardMetricCardProps = {
  title: string;

  value: string | number;

  icon?: ReactNode;

  description?: string;

  secondaryValue?: string;

  tone?: DashboardMetricTone;
};

export default function DashboardMetricCard({
  title,
  value,
  icon,
  description,
  secondaryValue,
  tone = "default",
}: DashboardMetricCardProps) {
  const presentation =
    getTonePresentation(tone);

  return (
    <div
      className={`rounded-3xl border p-4 transition ${presentation.cardClassName}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">
            {title}
          </div>

          <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>

        {icon ? (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${presentation.iconClassName}`}
          >
            {icon}
          </div>
        ) : null}
      </div>

      {description ||
      secondaryValue ? (
        <div className="mt-4 border-t border-slate-200/80 pt-3">
          {description ? (
            <div className="text-xs leading-5 text-slate-500">
              {description}
            </div>
          ) : null}

          {secondaryValue ? (
            <div
              className={`mt-1 text-sm font-semibold ${presentation.secondaryClassName}`}
            >
              {secondaryValue}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function getTonePresentation(
  tone: DashboardMetricTone
): {
  cardClassName: string;
  iconClassName: string;
  secondaryClassName: string;
} {
  if (tone === "brand") {
    return {
      cardClassName:
        "border-brand-100 bg-brand-50",

      iconClassName:
        "bg-white text-brand-600",

      secondaryClassName:
        "text-brand-700",
    };
  }

  if (tone === "success") {
    return {
      cardClassName:
        "border-emerald-100 bg-emerald-50",

      iconClassName:
        "bg-white text-emerald-700",

      secondaryClassName:
        "text-emerald-700",
    };
  }

  if (tone === "warning") {
    return {
      cardClassName:
        "border-amber-100 bg-amber-50",

      iconClassName:
        "bg-white text-amber-700",

      secondaryClassName:
        "text-amber-700",
    };
  }

  if (tone === "danger") {
    return {
      cardClassName:
        "border-red-100 bg-red-50",

      iconClassName:
        "bg-white text-red-700",

      secondaryClassName:
        "text-red-700",
    };
  }

  if (tone === "info") {
    return {
      cardClassName:
        "border-sky-100 bg-sky-50",

      iconClassName:
        "bg-white text-sky-700",

      secondaryClassName:
        "text-sky-700",
    };
  }

  return {
    cardClassName:
      "border-slate-200 bg-white",

    iconClassName:
      "bg-slate-100 text-slate-700",

    secondaryClassName:
      "text-slate-700",
  };
}