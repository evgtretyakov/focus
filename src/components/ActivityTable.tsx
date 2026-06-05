"use client";

import { useState } from "react";
import { Priority } from "@prisma/client";
import { ActivityRow } from "./ActivityRow";
import { PriorityBadge } from "./PriorityBadge";
import { SubtaskList } from "./SubtaskList";

type Activity = {
  id: string;
  title: string;
  priority: Priority;
  deadline: string | null;
  createdAt: string;
  subtasks: { id: string; title: string; completed: boolean; sortOrder: number }[];
};

type SortKey = "priority" | "deadline" | "createdAt";

const priorityOrder: Record<Priority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

function sortActivities(activities: Activity[], sortBy: SortKey): Activity[] {
  return [...activities].sort((a, b) => {
    if (sortBy === "priority") {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (sortBy === "deadline") {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function ActivityCard({
  activity,
  onUpdate,
}: {
  activity: Activity;
  onUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const deadlineDate = activity.deadline ? new Date(activity.deadline) : null;
  const isOverdue = deadlineDate && deadlineDate < new Date();

  async function deleteActivity() {
    if (!confirm("Удалить активность?")) return;
    await fetch(`/api/activities/${activity.id}`, { method: "DELETE" });
    onUpdate();
  }

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className="font-medium text-left flex-1"
          onClick={() => setExpanded(!expanded)}
        >
          {activity.title}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={deleteActivity}
            className="text-red-400 hover:text-red-600 text-sm"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400"
          >
            {expanded ? "▼" : "▶"}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <PriorityBadge priority={activity.priority} />
        <span className={isOverdue ? "text-red-600 font-medium" : "text-gray-600"}>
          {deadlineDate
            ? deadlineDate.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
            : "—"}
        </span>
      </div>
      {expanded && (
        <SubtaskList
          activityId={activity.id}
          subtasks={activity.subtasks}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}

export function ActivityTable({
  activities,
  onUpdate,
}: {
  activities: Activity[];
  onUpdate: () => void;
}) {
  const [sortBy, setSortBy] = useState<SortKey>("priority");
  const sorted = sortActivities(activities, sortBy);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <label className="text-sm text-gray-600 flex items-center gap-2">
          Сортировка
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="border rounded px-2 py-1"
          >
            <option value="priority">По приоритету</option>
            <option value="deadline">По дедлайну</option>
            <option value="createdAt">По дате создания</option>
          </select>
        </label>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="px-4 py-2 font-medium">Название</th>
              <th className="px-4 py-2 font-medium">Приоритет</th>
              <th className="px-4 py-2 font-medium">Дедлайн</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} onUpdate={onUpdate} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {sorted.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} onUpdate={onUpdate} />
        ))}
      </div>

      {sorted.length === 0 && (
        <p className="text-center text-gray-500 py-8">Нет активностей</p>
      )}
    </div>
  );
}
