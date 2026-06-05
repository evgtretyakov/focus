"use client";

import { useState } from "react";

type Subtask = { id: string; title: string; completed: boolean };

export function SubtaskList({
  activityId,
  subtasks: initial,
  onUpdate,
}: {
  activityId: string;
  subtasks: Subtask[];
  onUpdate: () => void;
}) {
  const [newTitle, setNewTitle] = useState("");

  async function toggle(id: string, completed: boolean) {
    await fetch(`/api/subtasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    });
    onUpdate();
  }

  async function addSubtask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await fetch(`/api/activities/${activityId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    setNewTitle("");
    onUpdate();
  }

  async function remove(id: string) {
    await fetch(`/api/subtasks/${id}`, { method: "DELETE" });
    onUpdate();
  }

  const done = initial.filter((s) => s.completed).length;

  return (
    <div className="pl-8 py-2 space-y-2 bg-gray-50">
      <p className="text-xs text-gray-500">{done}/{initial.length} выполнено</p>
      {initial.map((s) => (
        <div key={s.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={s.completed}
            onChange={() => toggle(s.id, s.completed)}
          />
          <span className={s.completed ? "line-through text-gray-400" : ""}>
            {s.title}
          </span>
          <button onClick={() => remove(s.id)} className="text-red-400 text-xs ml-auto">
            ✕
          </button>
        </div>
      ))}
      <form onSubmit={addSubtask} className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="+ подзадача..."
          className="flex-1 border rounded px-2 py-1 text-sm"
        />
      </form>
    </div>
  );
}
