"use client";

import { useState } from "react";
import { Priority } from "@prisma/client";
import { PriorityBadge } from "./PriorityBadge";
import { SubtaskList } from "./SubtaskList";

type Activity = {
  id: string;
  title: string;
  priority: Priority;
  deadline: string | null;
  subtasks: { id: string; title: string; completed: boolean; sortOrder: number }[];
};

export function ActivityRow({
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
    <>
      <tr
        className="border-b hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 font-medium">{activity.title}</td>
        <td className="px-4 py-3"><PriorityBadge priority={activity.priority} /></td>
        <td className={`px-4 py-3 text-sm ${isOverdue ? "text-red-600 font-medium" : "text-gray-600"}`}>
          {deadlineDate
            ? deadlineDate.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
            : "—"}
        </td>
        <td className="px-4 py-3 text-gray-400">
          <button onClick={(e) => { e.stopPropagation(); deleteActivity(); }} className="text-red-400 hover:text-red-600">
            ✕
          </button>
          <span className="ml-2">{expanded ? "▼" : "▶"}</span>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={4} className="p-0">
            <SubtaskList
              activityId={activity.id}
              subtasks={activity.subtasks}
              onUpdate={onUpdate}
            />
          </td>
        </tr>
      )}
    </>
  );
}
