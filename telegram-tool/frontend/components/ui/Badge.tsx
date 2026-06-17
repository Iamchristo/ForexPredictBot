import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-700 text-gray-200",
  running: "bg-blue-900 text-blue-300",
  paused: "bg-yellow-900 text-yellow-300",
  done: "bg-green-900 text-green-300",
  stopped: "bg-orange-900 text-orange-300",
  error: "bg-red-900 text-red-300",
};

export function Badge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
        STATUS_COLORS[status] || "bg-gray-700 text-gray-200"
      )}
    >
      {status}
    </span>
  );
}
