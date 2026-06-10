import { ActivityStatus, Priority } from "@prisma/client";

export type ActivityWithSubtasks = {
  id: string;
  title: string;
  priority: Priority;
  status: ActivityStatus;
  deadline: string | null;
  sortOrder: number;
  completedAt: string | null;
  subtasks: {
    id: string;
    title: string;
    completed: boolean;
    sortOrder: number;
  }[];
};
