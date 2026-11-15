/**
 * Pruebas de integración: levanta db-test, aplica migraciones, carga el seed y corre vitest.
 * Uso: npm run test:db   (KEEP_DB=1 deja el contenedor encendido al terminar)
 * Solo toca TEST_DATABASE_URL (por defecto localhost:5433/nami_test); nunca DATABASE_URL.
 */
import { spawnSync } from "node:child_process";

const url = process.env.TEST_DATABASE_URL ?? "postgres://nami:nami@localhost:5433/nami_test";
const host = new URL(url).hostname;
if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
  console.error(`TEST_DATABASE_URL apunta a ${host}, que no es local. Se cancela.`);
  process.exit(1);
}

const env = { ...process.env, DATABASE_URL: url, MIGRATE_DATABASE_URL: url, TEST_DATABASE_URL: url };
const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: true, env, ...opts });
  if (r.status !== 0) throw new Error(`Falló: ${cmd} ${args.join(" ")}`);
};

let code = 0;
try {
  run("docker", ["compose", "up", "-d", "--wait", "db-test"]);
  run("npx", ["drizzle-kit", "migrate"]);
  run("npx", ["tsx", "scripts/seed.ts"]);
  run("npx", ["vitest", "run", "--config", "vitest.db.config.mts", ...process.argv.slice(2)]);
} catch (e) {
  console.error(e.message);
  code = 1;
} finally {
  if (!process.env.KEEP_DB) spawnSync("docker", ["compose", "rm", "-sf", "db-test"], { stdio: "inherit", shell: true });
}
process.exit(code);
