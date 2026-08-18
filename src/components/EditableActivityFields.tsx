"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Priority } from "@prisma/client";
import { DatePicker, Input, Select, Typography } from "antd";
import type { InputRef } from "antd/es/input";
import dayjs, { type Dayjs } from "dayjs";
import { PriorityBadge } from "./PriorityBadge";

const priorityOptions = [
  { value: Priority.HIGH, label: "Высокий" },
  { value: Priority.MEDIUM, label: "Средний" },
  { value: Priority.LOW, label: "Низкий" },
];

async function patchActivity(
  id: string,
  body: Record<string, unknown>,
  onUpdate: () => void,
) {
  await fetch(`/api/activities/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  onUpdate();
}

function stopRowToggle(event: MouseEvent) {
  event.stopPropagation();
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return "—";
  const date = new Date(deadline);
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function isOverdue(deadline: string | null) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

const editableStyle = { cursor: "pointer" } as const;

export function EditableTitle({
  activityId,
  title,
  onUpdate,
  strong = true,
}: {
  activityId: string;
  title: string;
  onUpdate: () => void;
  strong?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    setValue(title);
  }, [title]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function save() {
    const trimmed = value.trim();
    setEditing(false);
    if (!trimmed || trimmed === title) {
      setValue(title);
      return;
    }
    await patchActivity(activityId, { title: trimmed }, onUpdate);
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        size="small"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onClick={stopRowToggle}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") void save();
          if (e.key === "Escape") {
            setValue(title);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <Typography.Text
      strong={strong}
      style={editableStyle}
      onDoubleClick={(e) => {
        stopRowToggle(e);
        setEditing(true);
      }}
    >
      {title}
    </Typography.Text>
  );
}

export function EditablePriority({
  activityId,
  priority,
  onUpdate,
}: {
  activityId: string;
  priority: Priority;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(priority);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setValue(priority);
  }, [priority]);

  useEffect(() => {
    if (editing) setOpen(true);
  }, [editing]);

  async function save(next?: Priority) {
    const saved = next ?? value;
    setEditing(false);
    setOpen(false);
    if (saved === priority) return;
    await patchActivity(activityId, { priority: saved }, onUpdate);
  }

  if (editing) {
    return (
      <Select
        size="small"
        autoFocus
        open={open}
        value={value}
        options={priorityOptions}
        style={{ minWidth: 120 }}
        onOpenChange={setOpen}
        onChange={(next) => {
          setValue(next);
          void save(next);
        }}
        onBlur={() => void save()}
        onClick={stopRowToggle}
        onKeyDown={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      style={editableStyle}
      onDoubleClick={(e) => {
        stopRowToggle(e);
        setEditing(true);
      }}
    >
      <PriorityBadge priority={priority} />
    </span>
  );
}

export function EditableDeadline({
  activityId,
  deadline,
  onUpdate,
  fontSize,
}: {
  activityId: string;
  deadline: string | null;
  onUpdate: () => void;
  fontSize?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<Dayjs | null>(
    deadline ? dayjs(deadline) : null,
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setValue(deadline ? dayjs(deadline) : null);
  }, [deadline]);

  useEffect(() => {
    if (editing) setOpen(true);
  }, [editing]);

  async function save(next?: Dayjs | null) {
    const saved = next !== undefined ? next : value;
    setEditing(false);
    setOpen(false);

    const nextIso = saved ? saved.format("YYYY-MM-DD") : null;
    const currentIso = deadline ? dayjs(deadline).format("YYYY-MM-DD") : null;
    if (nextIso === currentIso) return;

    await patchActivity(activityId, { deadline: nextIso }, onUpdate);
  }

  if (editing) {
    return (
      <DatePicker
        size="small"
        autoFocus
        open={open}
        value={value}
        format="DD.MM.YYYY"
        allowClear
        onOpenChange={setOpen}
        onChange={(next) => {
          setValue(next);
          void save(next);
        }}
        onBlur={() => void save()}
        onClick={stopRowToggle}
        onKeyDown={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <Typography.Text
      type={isOverdue(deadline) ? "danger" : "secondary"}
      style={{ ...editableStyle, fontSize }}
      onDoubleClick={(e) => {
        stopRowToggle(e);
        setEditing(true);
      }}
    >
      {formatDeadline(deadline)}
    </Typography.Text>
  );
}
