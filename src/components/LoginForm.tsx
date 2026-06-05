"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Form, Input, Typography } from "antd";

export function LoginForm() {
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(values: { password: string }) {
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: values.password }),
    });
    if (res.ok) {
      router.push("/activities");
      router.refresh();
    } else {
      setError("Неверный пароль");
    }
  }

  return (
    <Form
      onFinish={handleSubmit}
      layout="vertical"
      style={{ width: "100%", maxWidth: 360 }}
    >
      <Typography.Title level={2} style={{ marginTop: 0 }}>
        Focus
      </Typography.Title>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "Введите пароль" }]}
      >
        <Input.Password placeholder="Пароль" autoFocus />
      </Form.Item>
      {error && (
        <Form.Item>
          <Alert type="error" message={error} showIcon />
        </Form.Item>
      )}
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Войти
        </Button>
      </Form.Item>
    </Form>
  );
}
