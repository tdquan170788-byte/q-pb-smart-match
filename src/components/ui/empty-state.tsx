import Button from "./button";

type Props = {
  icon?: string;
  title: string;
  description?: string;
  buttonText?: string;
  onClick?: () => void;
};

export default function EmptyState({
  icon = "📭",
  title,
  description,
  buttonText,
  onClick,
}: Props) {
  return (
    <div className="py-12 text-center">
      <div className="text-5xl">
        {icon}
      </div>

      <div className="mt-4 text-lg font-bold">
        {title}
      </div>

      {description && (
        <p className="mt-2 text-slate-500">
          {description}
        </p>
      )}

      {buttonText && (
        <div className="mt-6">
          <Button onClick={onClick}>
            {buttonText}
          </Button>
        </div>
      )}
    </div>
  );
}
