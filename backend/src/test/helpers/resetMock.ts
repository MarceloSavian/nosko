export function resetMock(obj: object) {
  for (const value of Object.values(obj)) {
    const mock = (value as { mock?: { resetCalls: () => void } })?.mock;
    if (mock?.resetCalls) {
      mock.resetCalls();
    }
  }
}
