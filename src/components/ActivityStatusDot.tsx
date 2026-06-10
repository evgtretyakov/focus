import { ActivityStatus } from "@prisma/client";
import { Tooltip } from "antd";

const config: Record<ActivityStatus, { color: string; label: string }> = {
  IN_PROGRESS: { color: "#1677ff", label: "В работе" },
  COMPLETED: { color: "#52c41a", label: "Выполнена" },
};

export function ActivityStatusDot({ status }: { status: ActivityStatus }) {
  const { color, label } = config[status];
  return (
    <Tooltip title={label}>
      <span
        role="img"
        aria-label={label}
        style={{
          display: "inline-block",
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
    </Tooltip>
  );
}
