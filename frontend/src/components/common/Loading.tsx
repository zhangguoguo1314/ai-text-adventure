export default function Loading({ text = '加载中...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      <p className="mt-4 text-sm text-[var(--muted)]">{text}</p>
    </div>
  );
}
