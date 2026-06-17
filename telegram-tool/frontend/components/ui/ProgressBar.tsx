export function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full h-3 bg-surface border border-border rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-accent to-gold transition-all duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
