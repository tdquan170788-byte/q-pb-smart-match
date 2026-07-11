import type { ReactNode } from "react";

type Props = {
  title: string;
  action?: ReactNode;
};

export default function SectionTitle({
  title,
  action,
}: Props) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-bold text-slate-900">
        {title}
      </h2>

      {action}
    </div>
  );
}
