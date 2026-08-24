// Adds jest-dom's matchers (toBeInTheDocument, etc.) to Vitest's `expect`.
// Runs once before the test files, via vite.config.js's `test.setupFiles`.
import '@testing-library/jest-dom/vitest';

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Without this, each test's rendered component stays in the DOM for the
// next test in the same file - causing "found multiple elements" errors.
afterEach(() => {
  cleanup();
});
