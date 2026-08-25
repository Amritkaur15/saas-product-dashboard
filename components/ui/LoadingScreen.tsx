export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex flex-1 items-center justify-center text-sm text-gray-500"
    >
      {label}
    </div>
  );
}
