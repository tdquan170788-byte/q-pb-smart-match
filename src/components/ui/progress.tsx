type Props = {
  value: number;
  max: number;
};

export default function Progress({
  value,
  max,
}: Props) {
  const percent =
    max <= 0 ? 0 : Math.min(100, (value / max) * 100);

  return (
    <div className="w-full">
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-brand-600 transition-all"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>

      <div className="mt-2 text-xs text-slate-500">
        {value} / {max}
      </div>
    </div>
  );
}
