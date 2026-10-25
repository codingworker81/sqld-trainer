import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto'; // jsdom has no IndexedDB; Dexie needs this to run in tests

// jsdom does not implement scrollIntoView; SummaryPage's 목차 uses it to
// jump to a heading without touching location.hash (HashRouter safety).
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom does not implement matchMedia; ThemeProvider relies on it for the
// 'system' theme option, so provide a minimal stub for tests.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
