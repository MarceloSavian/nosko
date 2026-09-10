import { createWriteStream, mkdirSync, rmSync } from "node:fs"
import { ZipArchive } from "archiver"
import { build } from "esbuild"

const OUT_DIR = new URL("../dist", import.meta.url).pathname
const ARTIFACT = new URL("../../iac/environments/test/artifacts/bff-v1.zip", import.meta.url)
  .pathname

rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(OUT_DIR, { recursive: true })

await build({
  entryPoints: [new URL("../src/main/handler.ts", import.meta.url).pathname],
  outfile: `${OUT_DIR}/index.mjs`,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  minify: true,
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
})

await new Promise((resolve, reject) => {
  const output = createWriteStream(ARTIFACT)
  const archive = new ZipArchive({ zlib: { level: 9 } })
  output.on("close", resolve)
  archive.on("error", reject)
  archive.pipe(output)
  archive.file(`${OUT_DIR}/index.mjs`, { name: "index.mjs" })
  archive.finalize()
})

console.log(`built ${ARTIFACT}`)
