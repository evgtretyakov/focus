import { Priority } from "@prisma/client";

const colors: Record<Priority, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-yellow-400",
  LOW: "bg-green-500",
};

const labels: Record<Priority, string> = {
  HIGH: "Высокий",
  MEDIUM: "Средний",
  LOW: "Низкий",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded-full ${colors[priority]}`} />
      <span className="text-sm text-gray-600 hidden sm:inline">{labels[priority]}</span>
    </span>
  );
}
