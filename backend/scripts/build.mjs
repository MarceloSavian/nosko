import { createWriteStream, mkdirSync, rmSync } from "node:fs"
import { ZipArchive } from "archiver"
import { build } from "esbuild"

const ARTIFACTS = [
  { entry: "../src/main/handler.ts", name: "bff-v1" },
  { entry: "../src/main/fetchFxRates.ts", name: "fx-rates-v1" },
]

const buildArtifact = async ({ entry, name }) => {
  const outDir = new URL(`../dist/${name}`, import.meta.url).pathname
  const artifact = new URL(`../../iac/environments/test/artifacts/${name}.zip`, import.meta.url)
    .pathname

  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })

  await build({
    entryPoints: [new URL(entry, import.meta.url).pathname],
    outfile: `${outDir}/index.mjs`,
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
    const output = createWriteStream(artifact)
    const archive = new ZipArchive({ zlib: { level: 9 } })
    output.on("close", resolve)
    archive.on("error", reject)
    archive.pipe(output)
    archive.file(`${outDir}/index.mjs`, { name: "index.mjs" })
    archive.finalize()
  })

  console.log(`built ${artifact}`)
}

for (const artifact of ARTIFACTS) {
  await buildArtifact(artifact)
}
