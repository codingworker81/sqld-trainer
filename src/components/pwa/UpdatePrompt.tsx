import { useRegisterSW } from 'virtual:pwa-register/react';

/** "새 버전이 있습니다 — 새로고침" banner. Only acts when a new service
 * worker is waiting (registerType: 'prompt' means it never auto-activates). */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('Service worker registration failed', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="safe-top fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 bg-blue-600 px-4 py-3 text-sm text-white"
    >
      <span>새 버전이 있습니다</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="min-h-11 rounded-md bg-white/20 px-3 py-1.5 font-medium hover:bg-white/30"
        >
          새로고침
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          aria-label="닫기"
          className="min-h-11 min-w-11 rounded-md px-2 text-white/80 hover:bg-white/10"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
