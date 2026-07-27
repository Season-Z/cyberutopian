import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { resolveMicroAppMountElement } =
  require("../dist/index.js") as typeof import("../src/index");

test("uses the qiankun container without falling back to a global matching element", () => {
  const globalElement = { id: "global-root" } as unknown as Element;
  const documentRef = {
    querySelector: () => globalElement,
  } as unknown as Document;
  const container = {
    querySelector: () => null,
  } as unknown as HTMLElement;

  assert.equal(
    resolveMicroAppMountElement({ container }, "#root", documentRef),
    null,
  );
});

test("falls back to the provided document when no micro container exists", () => {
  const globalElement = { id: "global-root" } as unknown as Element;
  const documentRef = {
    querySelector: () => globalElement,
  } as unknown as Document;

  assert.equal(
    resolveMicroAppMountElement({}, "#root", documentRef),
    globalElement,
  );
});
