"use client";

import { Priority } from "@prisma/client";
import { Button, DatePicker, Form, Input, Select } from "antd";
import type { Dayjs } from "dayjs";

type FormValues = {
  title: string;
  priority: Priority;
  deadline?: Dayjs | null;
};

export function NewActivityForm({ onCreated }: { onCreated: () => void }) {
  const [form] = Form.useForm<FormValues>();

  async function handleSubmit(values: FormValues) {
    if (!values.title?.trim()) return;

    await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: values.title,
        priority: values.priority,
        deadline: values.deadline ? values.deadline.format("YYYY-MM-DD") : null,
      }),
    });

    form.resetFields();
    onCreated();
  }

  return (
    <Form
      form={form}
      layout="inline"
      onFinish={handleSubmit}
      initialValues={{ priority: Priority.MEDIUM }}
      style={{ flexWrap: "wrap", gap: 8 }}
    >
      <Form.Item
        name="title"
        rules={[{ required: true, message: "Введите название" }]}
        style={{ flex: "1 1 200px", minWidth: 200, marginBottom: 8 }}
      >
        <Input placeholder="Новая активность..." />
      </Form.Item>
      <Form.Item name="priority" style={{ marginBottom: 8 }}>
        <Select
          style={{ minWidth: 120 }}
          options={[
            { value: Priority.HIGH, label: "Высокий" },
            { value: Priority.MEDIUM, label: "Средний" },
            { value: Priority.LOW, label: "Низкий" },
          ]}
        />
      </Form.Item>
      <Form.Item name="deadline" style={{ marginBottom: 8 }}>
        <DatePicker placeholder="Дедлайн" format="DD.MM.YYYY" />
      </Form.Item>
      <Form.Item style={{ marginBottom: 8 }}>
        <Button type="primary" htmlType="submit">
          Добавить
        </Button>
      </Form.Item>
    </Form>
  );
}
