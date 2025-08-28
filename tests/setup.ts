import '@testing-library/jest-dom';

// モックセットアップ
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
