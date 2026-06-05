"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ActivityTable } from "@/components/ActivityTable";
import { NewActivityForm } from "@/components/NewActivityForm";
import { Priority } from "@prisma/client";

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

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <p className="text-gray-500">Загрузка...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Focus</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-black"
        >
          Выйти
        </button>
      </header>

      <div className="mb-6">
        <NewActivityForm onCreated={loadActivities} />
      </div>

      <ActivityTable activities={activities} onUpdate={loadActivities} />
    </main>
  );
}
