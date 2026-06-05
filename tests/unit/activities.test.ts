import { describe, it, expect } from "vitest";
import { validateActivityInput } from "@/lib/activities";

describe("validateActivityInput", () => {
  it("accepts valid title", () => {
    expect(validateActivityInput({ title: "Deploy" })).toEqual({ ok: true, title: "Deploy" });
  });

  it("rejects empty title", () => {
    expect(validateActivityInput({ title: "" }).ok).toBe(false);
  });
});
