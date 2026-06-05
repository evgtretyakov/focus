import { describe, it, expect } from "vitest";
import bcrypt from "bcrypt";
import { verifyPassword } from "@/lib/auth";

describe("verifyPassword", () => {
  it("returns true for matching password", async () => {
    const hash = await bcrypt.hash("secret123", 10);
    expect(await verifyPassword("secret123", hash)).toBe(true);
  });

  it("returns false for wrong password", async () => {
    const hash = await bcrypt.hash("secret123", 10);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
