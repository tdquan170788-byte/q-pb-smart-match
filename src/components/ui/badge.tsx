import type { ReactNode } from "react";

type Variant =
  | "info"
  | "success"
  | "warning"
  | "danger";

type Props = {
  children: ReactNode;
  variant?: Variant;
};

const styles: Record<Variant, string> = {
  info:
    "bg-blue-100 text-blue-700",

  success:
    "bg-green-100 text-green-700",

  warning:
    "bg-yellow-100 text-yellow-700",

  danger:
    "bg-red-100 text-red-700",
};

export default function Badge({
  children,
  variant = "info",
}: Props) {
  return (
    <span
      className={[
        "inline-flex",
        "items-center",
        "rounded-full",
        "px-3",
        "py-1",
        "text-xs",
        "font-semibold",
        styles[variant],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
