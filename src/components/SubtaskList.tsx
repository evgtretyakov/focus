"use client";

import { useState } from "react";
import { Button, Checkbox, Input, List, Space, Typography } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

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

  async function addSubtask() {
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
    <Space direction="vertical" size="small" style={{ width: "100%", padding: "8px 16px 8px 32px" }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {done}/{initial.length} выполнено
      </Typography.Text>
      <List
        size="small"
        dataSource={initial}
        locale={{ emptyText: "Нет подзадач" }}
        renderItem={(s) => (
          <List.Item
            actions={[
              <Button
                key="delete"
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => remove(s.id)}
                aria-label="Удалить подзадачу"
              />,
            ]}
          >
            <Checkbox
              checked={s.completed}
              onChange={() => toggle(s.id, s.completed)}
            >
              <Typography.Text delete={s.completed} type={s.completed ? "secondary" : undefined}>
                {s.title}
              </Typography.Text>
            </Checkbox>
          </List.Item>
        )}
      />
      <Input
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        onPressEnter={addSubtask}
        placeholder="+ подзадача..."
        size="small"
      />
    </Space>
  );
}
