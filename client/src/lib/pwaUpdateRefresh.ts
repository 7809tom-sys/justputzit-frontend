/**
 * Reloads the page when a *new* service worker takes over, so a deploy is picked up without the user
 * hard-refreshing.
 *
 * The worker is built with `clientsClaim: true`, so on a first visit the worker claims the page that is
 * still loading. That fires `controllerchange` too, and reloading there would throw away the page the
 * visitor just started loading — the first paint happens twice. Only a change of controller on a page
 * that already *had* one is a real update.
 */

export interface ServiceWorkerUpdateHost {
  /** Whether `navigator.serviceWorker.controller` was already set when this page started. */
  controllerAtLoad: boolean;
  onControllerChange(listener: () => void): void;
  /** Resolves the current registration, if the worker has registered yet. */
  getRegistration(): Promise<{ update(): Promise<unknown> } | undefined>;
  reload(): void;
}

export function createPwaUpdateRefresh(host: ServiceWorkerUpdateHost) {
  let reloadScheduled = false;
  let sawInitialClaim = !host.controllerAtLoad;

  const handleControllerChange = () => {
    if (sawInitialClaim) {
      // The worker installed on this very page claimed it. That is not an update.
      sawInitialClaim = false;
      return;
    }
    if (reloadScheduled) return;
    reloadScheduled = true;
    host.reload();
  };

  const checkForUpdate = () => {
    void host
      .getRegistration()
      .then(registration => registration?.update())
      .catch(() => undefined);
  };

  host.onControllerChange(handleControllerChange);

  return { handleControllerChange, checkForUpdate };
}

export function enablePwaUpdateRefresh() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const { checkForUpdate } = createPwaUpdateRefresh({
    // Read once, before the worker can claim this page.
    controllerAtLoad: Boolean(navigator.serviceWorker.controller),
    onControllerChange: listener =>
      navigator.serviceWorker.addEventListener("controllerchange", listener),
    getRegistration: () =>
      navigator.serviceWorker
        .getRegistration()
        .then(registration =>
          registration ? { update: () => registration.update() } : undefined
        ),
    reload: () => window.location.reload(),
  });

  window.addEventListener("focus", checkForUpdate);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkForUpdate();
  });
  checkForUpdate();
}
