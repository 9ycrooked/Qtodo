import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import {
  loadGlobalReminderMinutes,
  getReminderLabel,
  reminderOptions,
} from "./useReminderSetting";

const mockedInvoke = vi.mocked(invoke);

describe("useReminderSetting", () => {
  beforeEach(() => {
    mockedInvoke.mockClear();
  });

  describe("loadGlobalReminderMinutes", () => {
    it("returns the stored value when get_setting succeeds", async () => {
      mockedInvoke.mockResolvedValue("15" as never);
      const result = await loadGlobalReminderMinutes();
      expect(result).toBe("15");
      expect(mockedInvoke).toHaveBeenCalledWith("get_setting", {
        key: "default_reminder_minutes",
      });
    });

    it('returns default "5" when get_setting returns null', async () => {
      mockedInvoke.mockResolvedValue(null as never);
      const result = await loadGlobalReminderMinutes();
      expect(result).toBe("5");
    });

    it('returns default "5" when invoke throws', async () => {
      mockedInvoke.mockRejectedValue(new Error("db error") as never);
      const result = await loadGlobalReminderMinutes();
      expect(result).toBe("5");
    });
  });

  describe("getReminderLabel", () => {
    it("returns correct label for known values", () => {
      expect(getReminderLabel("5")).toBe("5 分钟");
      expect(getReminderLabel("60")).toBe("1 小时");
      expect(getReminderLabel("0")).toBe("准时");
      expect(getReminderLabel("-1")).toBe("关闭");
    });

    it('returns "5 分钟" as fallback for unknown value', () => {
      expect(getReminderLabel("999")).toBe("5 分钟");
    });
  });

  describe("reminderOptions", () => {
    it("contains all 7 expected options", () => {
      expect(reminderOptions).toHaveLength(7);
      const values = reminderOptions.map((o) => o.value);
      expect(values).toEqual(["5", "10", "15", "30", "60", "0", "-1"]);
    });
  });
});
