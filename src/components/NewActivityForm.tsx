"use client";

import { useState } from "react";
import { Priority } from "@prisma/client";

export function NewActivityForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [deadline, setDeadline] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        priority,
        deadline: deadline || null,
      }),
    });

    setTitle("");
    setPriority(Priority.MEDIUM);
    setDeadline("");
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Новая активность..."
        className="flex-1 min-w-[200px] border rounded px-3 py-2"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority)}
        className="border rounded px-3 py-2"
      >
        <option value={Priority.HIGH}>Высокий</option>
        <option value={Priority.MEDIUM}>Средний</option>
        <option value={Priority.LOW}>Низкий</option>
      </select>
      <input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className="border rounded px-3 py-2"
      />
      <button type="submit" className="bg-black text-white rounded px-4 py-2">
        Добавить
      </button>
    </form>
  );
}
