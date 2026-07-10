type Props = {
  name: string;
};

export default function Avatar({
  name,
}: Props) {
  const first =
    name.trim().charAt(0).toUpperCase();

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
      {first}
    </div>
  );
}