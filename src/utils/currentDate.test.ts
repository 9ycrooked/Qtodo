import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { currentDate } from "./currentDate";

describe("currentDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns local date at 00:00 local time", () => {
    vi.setSystemTime(new Date(2026, 5, 16, 0, 0, 0));
    expect(currentDate()).toBe("2026-06-16");
  });

  it("returns local date at 06:00 local time", () => {
    vi.setSystemTime(new Date(2026, 5, 16, 6, 0, 0));
    expect(currentDate()).toBe("2026-06-16");
  });

  it("returns local date at 12:00 local time", () => {
    vi.setSystemTime(new Date(2026, 5, 16, 12, 0, 0));
    expect(currentDate()).toBe("2026-06-16");
  });

  it("returns local date at 23:59 local time", () => {
    vi.setSystemTime(new Date(2026, 5, 16, 23, 59, 0));
    expect(currentDate()).toBe("2026-06-16");
  });

  it("returns new date after crossing midnight", () => {
    vi.setSystemTime(new Date(2026, 5, 16, 23, 59, 59));
    expect(currentDate()).toBe("2026-06-16");

    vi.setSystemTime(new Date(2026, 5, 17, 0, 0, 1));
    expect(currentDate()).toBe("2026-06-17");
  });
});
