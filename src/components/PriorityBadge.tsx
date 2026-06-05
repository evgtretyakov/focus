import { Priority } from "@prisma/client";
import { Tag } from "antd";

const config: Record<Priority, { color: string; label: string }> = {
  HIGH: { color: "red", label: "Высокий" },
  MEDIUM: { color: "gold", label: "Средний" },
  LOW: { color: "green", label: "Низкий" },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { color, label } = config[priority];
  return <Tag color={color}>{label}</Tag>;
}
