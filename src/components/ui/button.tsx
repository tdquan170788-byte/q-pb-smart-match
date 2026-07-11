import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "danger"
  | "success";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
};

const styles: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:opacity-90",

  secondary:
    "border border-slate-200 bg-white text-slate-700",

  danger:
    "bg-red-600 text-white",

  success:
    "bg-green-600 text-white",
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={[
        "rounded-2xl",
        "px-5",
        "py-3",
        "font-semibold",
        "transition",
        styles[variant],
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
