export default {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["@swc/jest"],
  },
  coverageProvider: "v8",
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.test.ts", "!src/index.ts"],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
}
