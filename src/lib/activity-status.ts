import { ActivityStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function computeActivityStatus(
  subtasks: { completed: boolean }[],
): ActivityStatus {
  if (subtasks.length === 0) return ActivityStatus.IN_PROGRESS;
  return subtasks.every((s) => s.completed)
    ? ActivityStatus.COMPLETED
    : ActivityStatus.IN_PROGRESS;
}

export async function syncActivityStatusFromSubtasks(
  activityId: string,
): Promise<void> {
  const [activity, subtasks] = await Promise.all([
    prisma.activity.findUniqueOrThrow({ where: { id: activityId } }),
    prisma.subtask.findMany({ where: { activityId } }),
  ]);

  const status = computeActivityStatus(subtasks);
  if (activity.status === status) return;

  await prisma.activity.update({
    where: { id: activityId },
    data: {
      status,
      completedAt:
        status === ActivityStatus.COMPLETED ? new Date() : null,
    },
  });
}
