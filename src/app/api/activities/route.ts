import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { validateActivityInput } from "@/lib/activities";
import { Priority } from "@prisma/client";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const activities = await prisma.activity.findMany({
    include: { subtasks: { orderBy: { sortOrder: "asc" } } },
    orderBy: [
      { status: "asc" },
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
  });
  return NextResponse.json(activities);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const validated = validateActivityInput(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const maxOrder = await prisma.activity.aggregate({ _max: { sortOrder: true } });
  const activity = await prisma.activity.create({
    data: {
      title: validated.title,
      priority: (body.priority as Priority) ?? Priority.MEDIUM,
      deadline: body.deadline ? new Date(body.deadline) : null,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
    include: { subtasks: true },
  });
  return NextResponse.json(activity, { status: 201 });
}
