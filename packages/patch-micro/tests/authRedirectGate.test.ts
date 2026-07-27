import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { createAuthRedirectGate } =
  require("../dist/index.js") as typeof import("../src/index");

test("allows only one redirect during the single-flight window", () => {
  let now = 1_000;
  const gate = createAuthRedirectGate({
    now: () => now,
    singleFlightMs: 1_500,
  });

  assert.equal(gate.acquire(), true);
  assert.equal(gate.acquire(), false);

  now += 1_501;

  assert.equal(gate.acquire(), true);
});

test("allows an immediate retry after reset", () => {
  const gate = createAuthRedirectGate({ now: () => 1_000 });

  assert.equal(gate.acquire(), true);
  assert.equal(gate.acquire(), false);

  gate.reset();

  assert.equal(gate.acquire(), true);
});

test("supports a zero millisecond single-flight window", () => {
  const gate = createAuthRedirectGate({
    now: () => 1_000,
    singleFlightMs: 0,
  });

  assert.equal(gate.acquire(), true);
  assert.equal(gate.acquire(), true);
});
