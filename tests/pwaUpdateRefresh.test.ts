import { describe, expect, it, vi } from "vitest";
import { createPwaUpdateRefresh } from "../client/src/lib/pwaUpdateRefresh";

function makeHost(controllerAtLoad: boolean) {
  let controllerChange: (() => void) | undefined;
  const reload = vi.fn();
  const update = vi.fn().mockResolvedValue(undefined);
  const host = {
    controllerAtLoad,
    onControllerChange: (listener: () => void) => {
      controllerChange = listener;
    },
    getRegistration: vi.fn().mockResolvedValue({ update }),
    reload,
  };
  return {
    host,
    reload,
    update,
    fireControllerChange: () => controllerChange?.(),
  };
}

describe("PWA update refresh", () => {
  it("does not reload when the worker first claims a page that had no controller", () => {
    const { host, reload, fireControllerChange } = makeHost(false);
    createPwaUpdateRefresh(host);

    fireControllerChange();

    expect(reload).not.toHaveBeenCalled();
  });

  it("reloads when an existing controller is replaced by a newly deployed worker", () => {
    const { host, reload, fireControllerChange } = makeHost(true);
    createPwaUpdateRefresh(host);

    fireControllerChange();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("ignores the initial claim but still reloads for a real update afterwards", () => {
    const { host, reload, fireControllerChange } = makeHost(false);
    createPwaUpdateRefresh(host);

    fireControllerChange(); // the worker that installed on this page claims it
    expect(reload).not.toHaveBeenCalled();

    fireControllerChange(); // a later deploy takes over
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reloads at most once even if several controller changes arrive", () => {
    const { host, reload, fireControllerChange } = makeHost(true);
    createPwaUpdateRefresh(host);

    fireControllerChange();
    fireControllerChange();
    fireControllerChange();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("asks the registered worker to check for an update", async () => {
    const { host, update } = makeHost(true);
    const { checkForUpdate } = createPwaUpdateRefresh(host);

    checkForUpdate();
    await Promise.resolve();
    await Promise.resolve();

    expect(update).toHaveBeenCalled();
  });

  it("stays quiet when there is no registration yet, or when checking fails", async () => {
    const host = {
      controllerAtLoad: true,
      onControllerChange: () => undefined,
      getRegistration: vi.fn().mockResolvedValue(undefined),
      reload: vi.fn(),
    };
    const { checkForUpdate } = createPwaUpdateRefresh(host);
    checkForUpdate();
    await Promise.resolve();

    const failing = {
      controllerAtLoad: true,
      onControllerChange: () => undefined,
      getRegistration: vi.fn().mockRejectedValue(new Error("offline")),
      reload: vi.fn(),
    };
    const second = createPwaUpdateRefresh(failing);
    expect(() => second.checkForUpdate()).not.toThrow();
    await Promise.resolve();
  });
});
