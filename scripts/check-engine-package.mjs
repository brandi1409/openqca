/**
 * Prüft, dass `@openqca/engine` als npm-Paket wirklich benutzbar ist.
 *
 * Ein `npm pack`, das durchläuft, beweist nichts: Der häufige Fehler ist ein
 * Paket, dessen Einstiegspunkt auf TypeScript-Quellen zeigt oder dessen
 * relative Importe die Endung `.ts` behalten. Beides fällt erst auf, wenn man
 * das Tarball in einem fremden Projekt installiert und die Funktionen aufruft —
 * genau das macht dieses Skript.
 *
 * Aufruf: node scripts/check-engine-package.mjs
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const enginePath = join(repoRoot, "packages", "engine");

function run(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

let workdir;
try {
  console.log("→ Engine bauen und packen");
  run("npm", ["run", "build"], enginePath);
  const packOut = run("npm", ["pack", "--json"], enginePath);
  const tarballName = JSON.parse(packOut)[0].filename;
  const tarball = join(enginePath, tarballName);

  workdir = mkdtempSync(join(tmpdir(), "openqca-engine-check-"));
  writeFileSync(
    join(workdir, "package.json"),
    JSON.stringify({ name: "engine-consumer", private: true, type: "module" }, null, 2),
  );

  console.log(`→ ${tarballName} in einem leeren Projekt installieren`);
  run("npm", ["install", tarball, "--no-audit", "--no-fund"], workdir);

  // Der eigentliche Beweis: importieren und rechnen, ohne Type-Stripping.
  writeFileSync(
    join(workdir, "probe.mjs"),
    [
      'import { calibrateDirect, inclusionConsistency } from "@openqca/engine";',
      "const mid = calibrateDirect(600, 300, 600, 1000);",
      "if (Math.abs(mid - 0.5) > 1e-12) throw new Error(`Kreuzungspunkt ${mid} statt 0.5`);",
      "const c = inclusionConsistency([1, 1, 0], [1, 1, 0]);",
      "if (Math.abs(c - 1) > 1e-12) throw new Error(`Konsistenz ${c} statt 1`);",
      'console.log("   Kreuzungspunkt", mid, "· Konsistenz", c);',
    ].join("\n"),
  );
  console.log("→ importieren und rechnen");
  process.stdout.write(run("node", ["probe.mjs"], workdir));

  rmSync(tarball, { force: true });
  console.log("PASS  @openqca/engine ist installierbar und rechnet nach der Installation.");
} catch (error) {
  console.error("FAIL  @openqca/engine ist so nicht benutzbar.");
  console.error(error.stdout?.toString() ?? "");
  console.error(error.stderr?.toString() ?? String(error));
  process.exitCode = 1;
} finally {
  if (workdir) rmSync(workdir, { recursive: true, force: true });
  // Ein liegengebliebenes Tarball würde beim nächsten Lauf mitgepackt werden.
  for (const entry of readdirSync(enginePath)) {
    if (entry.startsWith("openqca-engine-") && entry.endsWith(".tgz")) {
      rmSync(join(enginePath, entry), { force: true });
    }
  }
}
