/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */

const config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "./coverage",
  rootDir: ".",
  coverageProvider: "v8",
  coverageReporters: ["lcov", "text"],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};

export default config;
