import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import type { Update } from "@tauri-apps/plugin-updater";
import UpdateDialog from "./UpdateDialog.vue";

// Mock @tauri-apps/plugin-updater
vi.mock("@tauri-apps/plugin-updater", () => ({
  check: vi.fn(),
}));

// Mock @tauri-apps/plugin-process
vi.mock("@tauri-apps/plugin-process", () => ({
  relaunch: vi.fn(),
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

const makePendingUpdate = (version = "0.2.0", body = "Fixes:\n- Bug A") =>
  ({
    version,
    body,
    date: "2026-06-20T00:00:00Z",
    download: vi.fn(),
    install: vi.fn(),
    close: vi.fn(),
  }) as unknown as Update;

const defaultProps = {
  pendingUpdate: makePendingUpdate(),
  downloadState: "idle" as const,
  downloadedBytes: 0,
  totalBytes: 0,
  progressPercent: 0,
};

describe("UpdateDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders version and body from pendingUpdate", () => {
    const wrapper = mount(UpdateDialog, {
      props: {
        modelValue: true,
        ...defaultProps,
        pendingUpdate: makePendingUpdate("0.3.0", "New feature!"),
      },
      global: {
        stubs: { QmDialog: QmDialogStub },
      },
    });

    expect(wrapper.text()).toContain("Qtodo v0.3.0 可用");
    expect(wrapper.text()).toContain("New feature!");
  });

  it("shows dismiss button with '稍后' when idle", () => {
    const wrapper = mount(UpdateDialog, {
      props: {
        modelValue: true,
        ...defaultProps,
        downloadState: "idle",
      },
      global: {
        stubs: { QmDialog: QmDialogStub },
      },
    });

    const dismissBtn = wrapper.findAll("button").find((b) => b.text().includes("稍后"));
    expect(dismissBtn).toBeDefined();
  });

  it("shows dismiss button with '后台下载' when downloading", () => {
    const wrapper = mount(UpdateDialog, {
      props: {
        modelValue: true,
        ...defaultProps,
        downloadState: "downloading",
        downloadedBytes: 500,
        totalBytes: 1000,
        progressPercent: 50,
      },
      global: {
        stubs: { QmDialog: QmDialogStub },
      },
    });

    const dismissBtn = wrapper.findAll("button").find((b) => b.text().includes("后台下载"));
    expect(dismissBtn).toBeDefined();
  });

  it("shows progress bar when downloading with known total", () => {
    const wrapper = mount(UpdateDialog, {
      props: {
        modelValue: true,
        ...defaultProps,
        downloadState: "downloading",
        downloadedBytes: 470,
        totalBytes: 1000,
        progressPercent: 47,
      },
      global: {
        stubs: { QmDialog: QmDialogStub },
      },
    });

    expect(wrapper.text()).toContain("47%");
    const fill = wrapper.find(".progress-bar-fill");
    expect(fill.exists()).toBe(true);
    expect(fill.attributes("style")).toContain("width: 47%");
  });

  it("shows indeterminate progress when totalBytes is 0", () => {
    const wrapper = mount(UpdateDialog, {
      props: {
        modelValue: true,
        ...defaultProps,
        downloadState: "downloading",
        downloadedBytes: 0,
        totalBytes: 0,
        progressPercent: 0,
      },
      global: {
        stubs: { QmDialog: QmDialogStub },
      },
    });

    expect(wrapper.text()).toContain("正在下载更新");
    const fill = wrapper.find(".progress-bar-fill.indeterminate");
    expect(fill.exists()).toBe(true);
  });

  it("shows '立即安装' and download complete message when downloaded", () => {
    const wrapper = mount(UpdateDialog, {
      props: {
        modelValue: true,
        ...defaultProps,
        downloadState: "downloaded",
      },
      global: {
        stubs: { QmDialog: QmDialogStub },
      },
    });

    expect(wrapper.text()).toContain("下载完成，是否立即安装？");
    const installBtn = wrapper.findAll("button").find((b) => b.text().includes("立即安装"));
    expect(installBtn).toBeDefined();
  });

  it("hides dismiss button when downloaded", () => {
    const wrapper = mount(UpdateDialog, {
      props: {
        modelValue: true,
        ...defaultProps,
        downloadState: "downloaded",
      },
      global: {
        stubs: { QmDialog: QmDialogStub },
      },
    });

    const laterBtn = wrapper.findAll("button").find((b) => b.text().includes("稍后"));
    expect(laterBtn).toBeUndefined();
    const bgBtn = wrapper.findAll("button").find((b) => b.text().includes("后台下载"));
    expect(bgBtn).toBeUndefined();
  });

  it("shows error message when downloadState is error", () => {
    const wrapper = mount(UpdateDialog, {
      props: {
        modelValue: true,
        ...defaultProps,
        downloadState: "error",
      },
      global: {
        stubs: { QmDialog: QmDialogStub },
      },
    });

    expect(wrapper.text()).toContain("下载失败，请重试。");
  });

  it("emits dismiss event when dismiss button clicked", async () => {
    const wrapper = mount(UpdateDialog, {
      props: {
        modelValue: true,
        ...defaultProps,
        downloadState: "idle",
      },
      global: {
        stubs: { QmDialog: QmDialogStub },
      },
    });

    const dismissBtn = wrapper.findAll("button").find((b) => b.text().includes("稍后"));
    await dismissBtn!.trigger("click");

    expect(wrapper.emitted("dismiss")).toHaveLength(1);
  });

  it("emits install event when install button clicked", async () => {
    const wrapper = mount(UpdateDialog, {
      props: {
        modelValue: true,
        ...defaultProps,
        downloadState: "downloaded",
      },
      global: {
        stubs: { QmDialog: QmDialogStub },
      },
    });

    const installBtn = wrapper.findAll("button").find((b) => b.text().includes("立即安装"));
    await installBtn!.trigger("click");

    expect(wrapper.emitted("install")).toHaveLength(1);
  });
});
