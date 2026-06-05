import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.completed !== undefined) data.completed = Boolean(body.completed);

  const subtask = await prisma.subtask.update({ where: { id }, data });

  const allSubtasks = await prisma.subtask.findMany({
    where: { activityId: subtask.activityId },
  });
  if (allSubtasks.length > 0 && allSubtasks.every((s) => s.completed)) {
    await prisma.activity.update({
      where: { id: subtask.activityId },
      data: { completedAt: new Date() },
    });
  }

  return NextResponse.json(subtask);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  await prisma.subtask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
