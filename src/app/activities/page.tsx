"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, Layout, Spin, Typography } from "antd";
import { ActivityTable } from "@/components/ActivityTable";
import { NewActivityForm } from "@/components/NewActivityForm";
import { Priority } from "@prisma/client";

const { Content } = Layout;

type Activity = {
  id: string;
  title: string;
  priority: Priority;
  deadline: string | null;
  createdAt: string;
  subtasks: { id: string; title: string; completed: boolean; sortOrder: number }[];
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadActivities = useCallback(async () => {
    const res = await fetch("/api/activities");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (res.ok) {
      setActivities(await res.json());
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: "16px 32px", maxWidth: 1024, margin: "0 auto", width: "100%" }}>
        <Spin spinning={loading}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <Typography.Title level={2} style={{ margin: 0 }}>
              Focus
            </Typography.Title>
            <Button type="link" onClick={handleLogout}>
              Выйти
            </Button>
          </div>

          <div style={{ marginBottom: 24 }}>
            <NewActivityForm onCreated={loadActivities} />
          </div>

          {!loading && <ActivityTable activities={activities} onUpdate={loadActivities} />}
        </Spin>
      </Content>
    </Layout>
  );
}
