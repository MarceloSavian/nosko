export class CookieJar {
  private readonly cookies = new Map<string, string>()

  applyResponse(response: Response): void {
    for (const setCookie of response.headers.getSetCookie()) {
      const [pair] = setCookie.split(";")
      const eq = pair?.indexOf("=") ?? -1
      if (pair === undefined || eq < 0) {
        continue
      }
      const name = pair.slice(0, eq).trim()
      const value = pair.slice(eq + 1).trim()
      if (
        /(^|;\s*)max-age=0(;|$)/i.test(setCookie) ||
        /expires=Thu, 01 Jan 1970/i.test(setCookie)
      ) {
        this.cookies.delete(name)
      } else {
        this.cookies.set(name, value)
      }
    }
  }

  header(): string {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ")
  }
}
