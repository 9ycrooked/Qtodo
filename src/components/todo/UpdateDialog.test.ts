import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import UpdateDialog from "./UpdateDialog.vue";

// Mock @tauri-apps/plugin-updater
vi.mock("@tauri-apps/plugin-updater", () => ({
  check: vi.fn(),
}));

// Mock @tauri-apps/plugin-process
vi.mock("@tauri-apps/plugin-process", () => ({
  relaunch: vi.fn(),
}));

// Mock @tauri-apps/api/window
vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: vi.fn(() => ({
    close: vi.fn(),
  })),
}));

// Stub QmDialog to render slot content directly
const QmDialogStub = defineComponent({
  name: "QmDialog",
  props: {
    modelValue: Boolean,
    title: String,
  },
  setup(_props, { slots }) {
    return () => slots.default?.({ close: () => {} });
  },
});

const makePendingUpdate = (version = "0.2.0", body = "Fixes:\n- Bug A") => ({
  version,
  body,
  date: "2026-06-20T00:00:00Z",
  download: vi.fn(),
  downloadAndInstall: vi.fn(),
  close: vi.fn(),
});

describe("UpdateDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders version and body from pendingUpdate", () => {
    const wrapper = mount(UpdateDialog, {
      props: {
        modelValue: true,
        pendingUpdate: makePendingUpdate("0.3.0", "New feature!"),
        installState: "idle",
      },
      global: {
        stubs: { QmDialog: QmDialogStub },
      },
    });

    expect(wrapper.text()).toContain("Qtodo v0.3.0 可用");
    expect(wrapper.text()).toContain("New feature!");
  });

  it("emits install event when install button clicked", async () => {
    const wrapper = mount(UpdateDialog, {
      props: {
        modelValue: true,
        pendingUpdate: makePendingUpdate(),
        installState: "idle",
      },
      global: {
        stubs: { QmDialog: QmDialogStub },
      },
    });

    const installBtn = wrapper.findAll("button").find((b) => b.text().includes("立即安装"));
    expect(installBtn).toBeDefined();
    await installBtn!.trigger("click");

    expect(wrapper.emitted("install")).toHaveLength(1);
  });

  it("emits later event when 稍后 button clicked", async () => {
    const wrapper = mount(UpdateDialog, {
      props: {
        modelValue: true,
        pendingUpdate: makePendingUpdate(),
        installState: "idle",
      },
      global: {
        stubs: { QmDialog: QmDialogStub },
      },
    });

    const laterBtn = wrapper.findAll("button").find((b) => b.text().includes("稍后"));
    expect(laterBtn).toBeDefined();
    await laterBtn!.trigger("click");

    expect(wrapper.emitted("later")).toHaveLength(1);
  });

  it("disables buttons when installState is installing", () => {
    const wrapper = mount(UpdateDialog, {
      props: {
        modelValue: true,
        pendingUpdate: makePendingUpdate(),
        installState: "installing",
      },
      global: {
        stubs: { QmDialog: QmDialogStub },
      },
    });

    const disabledButtons = wrapper.findAll("button[disabled]");
    expect(disabledButtons.length).toBe(3);

    const installBtn = wrapper.findAll("button").find((b) => b.text().includes("安装中"));
    expect(installBtn).toBeDefined();
  });

  it("shows error message when installState is error", () => {
    const wrapper = mount(UpdateDialog, {
      props: {
        modelValue: true,
        pendingUpdate: makePendingUpdate(),
        installState: "error",
      },
      global: {
        stubs: { QmDialog: QmDialogStub },
      },
    });

    expect(wrapper.text()).toContain("下载失败，请重试。");
  });
});
