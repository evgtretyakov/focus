import bcrypt from "bcrypt";
import { getSession } from "./session";
import { NextResponse } from "next/server";

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getOwnerPasswordHash(): string {
  const hash = process.env.OWNER_PASSWORD_HASH;
  if (!hash) throw new Error("OWNER_PASSWORD_HASH is not set");
  return hash;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}
