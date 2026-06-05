import { Priority } from "@prisma/client";

export type ActivityWithSubtasks = {
  id: string;
  title: string;
  priority: Priority;
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
