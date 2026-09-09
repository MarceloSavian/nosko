export default {
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
  moduleNameMapper: {
    "^@nosko/contracts$": "<rootDir>/../packages/contracts/src/index.ts",
  },
  coverageProvider: "v8",
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/main.tsx",
    "!src/vite-env.d.ts",
    "!src/test/**",
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
}
