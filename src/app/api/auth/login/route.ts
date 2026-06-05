import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { verifyPassword, getOwnerPasswordHash } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }
  const valid = await verifyPassword(password, getOwnerPasswordHash());
  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const session = await getSession();
  session.isLoggedIn = true;
  await session.save();
  return NextResponse.json({ ok: true });
}
