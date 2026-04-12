import { cpSync, createWriteStream, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';

const handlers = [
  'customer-v1',
  'profile-v1',
  'account-v1',
  'institution-v1',
  'partnership-v1',
  'transaction-v1',
  'budget-v1',
  'dashboard-v1',
  'docs-v1',
  'migration-v1',
  'admin-v1',
];

const env = process.argv[2] || 'prod';
const validEnvs = ['test', 'prod'];
if (!validEnvs.includes(env)) {
  console.error(`Invalid environment: ${env}. Must be one of: ${validEnvs.join(', ')}`);
  process.exit(1);
}

const outDir = `../iac/environments/${env}/artifacts`;

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

async function createZip(sourceDir, outputPath) {
  const archiver = (await import('archiver')).default;
  const output = createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  const done = new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', reject);
  });

  archive.pipe(output);
  archive.directory(sourceDir, false);
  await archive.finalize();
  await done;
}

for (const handler of handlers) {
  const entryPoint = `src/handlers/api/${handler}.ts`;
  const bundleDir = `dist/${handler}`;

  await build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outfile: `${bundleDir}/index.mjs`,
    minify: true,
    sourcemap: true,
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
    },
  });

  if (handler === 'docs-v1') {
    cpSync('openapi.json', join(bundleDir, 'openapi.json'));
  }

  if (handler === 'migration-v1') {
    const migrationsOut = join(bundleDir, 'migrations');
    mkdirSync(migrationsOut, { recursive: true });
    cpSync('migrations', migrationsOut, { recursive: true });
  }

  await createZip(bundleDir, `${outDir}/${handler}.zip`);
  console.log(`Built ${handler}.zip`);
}

console.log('All handlers built.');
