import { ReactNode } from "react";

type Props = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
};

export default function SectionCard({ title, action, children }: Props) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}