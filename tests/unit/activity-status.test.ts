import { describe, it, expect } from "vitest";
import { ActivityStatus } from "@prisma/client";
import { computeActivityStatus } from "@/lib/activity-status";

describe("computeActivityStatus", () => {
  it("returns IN_PROGRESS when there are no subtasks", () => {
    expect(computeActivityStatus([])).toBe(ActivityStatus.IN_PROGRESS);
  });

  it("returns IN_PROGRESS when some subtasks are incomplete", () => {
    expect(
      computeActivityStatus([
        { completed: true },
        { completed: false },
      ]),
    ).toBe(ActivityStatus.IN_PROGRESS);
  });

  it("returns COMPLETED when all subtasks are done", () => {
    expect(
      computeActivityStatus([
        { completed: true },
        { completed: true },
      ]),
    ).toBe(ActivityStatus.COMPLETED);
  });
});
