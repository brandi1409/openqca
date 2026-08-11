import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const deploy = join(root, "deploy");
const fixtureDir = mkdtempSync(join(tmpdir(), "openqca-deployment-check-"));
const digest = "a".repeat(64);
const caddyDigest = "b".repeat(64);
const composeEnvKeys = [
  "OPENQCA_IMAGE",
  "OPENQCA_PROXY_MODE",
  "OPENQCA_UPSTREAM_PORT",
  "NEXT_PUBLIC_SITE_URL",
  "AI_ENABLED",
  "AI_PROVIDER",
  "AI_REQUIRE_CLOUD_TIER",
  "OPENAI_API_KEY",
  "OPENAI_AI_MODEL",
  "GEMINI_API_KEY",
  "GEMINI_AI_MODEL",
  "AI_REQUEST_BODY_BYTES",
  "AI_PREAUTH_RATE_LIMIT",
  "AI_USER_RATE_LIMIT",
  "AI_MAX_CONCURRENT",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_MONTHLY",
  "STRIPE_PRICE_INSTITUTION",
  "CADDY_IMAGE",
  "OPENQCA_DOMAIN",
  "CADDY_EMAIL",
];

const composeProcessEnv = { ...process.env };
for (const key of composeEnvKeys) delete composeProcessEnv[key];

function renderCompose(file, envFile) {
  const output = execFileSync(
    "docker",
    ["compose", "--env-file", envFile, "-f", join(deploy, file), "config", "--format", "json"],
    { cwd: root, encoding: "utf8", env: composeProcessEnv },
  );
  return JSON.parse(output);
}

try {
  execFileSync("bash", ["-n", join(deploy, "staging-release.sh")], { cwd: root });

  const sharedEnv = join(fixtureDir, "shared.env");
  writeFileSync(
    sharedEnv,
    [
      "OPENQCA_PROXY_MODE=shared",
      "OPENQCA_UPSTREAM_PORT=3212",
      `OPENQCA_IMAGE=ghcr.io/example/openqca-web@sha256:${digest}`,
      "NEXT_PUBLIC_SITE_URL=https://staging.example.org",
      "AI_ENABLED=false",
      "",
    ].join("\n"),
    { mode: 0o600 },
  );

  const shared = renderCompose("docker-compose.shared-caddy.yml", sharedEnv);
  assert.deepEqual(Object.keys(shared.services).sort(), ["web"]);
  assert.equal(shared.services.web.image, `ghcr.io/example/openqca-web@sha256:${digest}`);
  assert.deepEqual(shared.services.web.ports, [
    {
      mode: "ingress",
      host_ip: "127.0.0.1",
      target: 3000,
      published: "3212",
      protocol: "tcp",
    },
  ]);

  const managedEnv = join(fixtureDir, "managed.env");
  writeFileSync(
    managedEnv,
    [
      "OPENQCA_PROXY_MODE=managed",
      `OPENQCA_IMAGE=ghcr.io/example/openqca-web@sha256:${digest}`,
      `CADDY_IMAGE=caddy@sha256:${caddyDigest}`,
      "OPENQCA_DOMAIN=staging.example.org",
      "CADDY_EMAIL=ops@example.org",
      "NEXT_PUBLIC_SITE_URL=https://staging.example.org",
      "AI_ENABLED=false",
      "",
    ].join("\n"),
    { mode: 0o600 },
  );

  const managed = renderCompose("docker-compose.yml", managedEnv);
  assert.deepEqual(Object.keys(managed.services).sort(), ["caddy", "web"]);
  assert.equal(managed.services.web.image, shared.services.web.image);
  assert.deepEqual(
    managed.services.caddy.ports.map(({ target, published }) => ({ target, published })),
    [
      { target: 80, published: "80" },
      { target: 443, published: "443" },
    ],
  );

  console.log("Deployment Compose contracts passed: managed proxy and loopback-only shared proxy.");
} finally {
  rmSync(fixtureDir, { recursive: true, force: true });
}
