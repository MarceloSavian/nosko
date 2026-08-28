import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const ROOTS = ["backend/src", "web/src", "packages"]
const SKIP = new Set(["node_modules", "dist", "coverage"])
const FORBIDDEN = [
  { re: /\btry\s*\{/, msg: "try/catch is banned — handle failures via the Effect error channel" },
  { re: /\.catch\s*\(/, msg: "bare Promise.catch is banned — model failures as Effect errors" },
]

const files = []
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP.has(e.name)) walk(join(dir, e.name))
    } else if (/\.(ts|tsx)$/.test(e.name)) {
      files.push(join(dir, e.name))
    }
  }
}

for (const root of ROOTS) {
  if (statSync(root, { throwIfNoEntry: false })) walk(root)
}

const violations = []
for (const file of files) {
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      for (const { re, msg } of FORBIDDEN) {
        if (re.test(line)) violations.push(`${file}:${i + 1}  ${msg}`)
      }
    })
}

if (violations.length > 0) {
  console.error("no-try-catch guard failed:")
  for (const v of violations) console.error(`  ${v}`)
  process.exit(1)
}
console.log(`no-try-catch guard passed (${files.length} files)`)
