import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const {
  createBrowserCallbackUrl,
  createShellRedirectPath,
  createStandaloneShellLoginUrl,
  getCurrentRedirectPath,
} = require("../dist/index.js") as typeof import("../src/index");

test("keeps pathname, query and hash in the current redirect path", () => {
  assert.equal(
    getCurrentRedirectPath({
      pathname: "/device/list",
      search: "?page=2",
      hash: "#row-8",
    }),
    "/device/list?page=2#row-8",
  );
});

test("maps a child route under the shell active rule without duplicating it", () => {
  assert.equal(
    createShellRedirectPath({
      currentPath: "/device/list?page=2#row-8",
      shellActiveRule: "/maintenance/",
    }),
    "/maintenance/device/list?page=2#row-8",
  );

  assert.equal(
    createShellRedirectPath({
      currentPath: "/maintenance/device/list?page=2#row-8",
      shellActiveRule: "/maintenance",
    }),
    "/maintenance/device/list?page=2#row-8",
  );
});

test("rejects external redirect paths", () => {
  assert.equal(
    createShellRedirectPath({
      currentPath: "https://evil.example/phish",
      shellActiveRule: "/maintenance",
    }),
    "/maintenance",
  );
  assert.equal(
    createShellRedirectPath({
      currentPath: "//evil.example/phish",
      shellActiveRule: "/maintenance",
    }),
    "/maintenance",
  );
  assert.equal(
    createShellRedirectPath({
      currentPath: "/\\evil.example/phish",
      shellActiveRule: "/maintenance",
    }),
    "/maintenance",
  );
});

test("creates a shell login URL with an encoded local return path", () => {
  assert.equal(
    createStandaloneShellLoginUrl({
      shellOrigin: "https://portal.example.com/some/path",
      shellActiveRule: "/maintenance",
      currentPath: "/device/list?page=2#row-8",
    }),
    "https://portal.example.com/login?redirect=%2Fmaintenance%2Fdevice%2Flist%3Fpage%3D2%23row-8",
  );
});

test("returns an empty login URL for disabled or unsafe configuration", () => {
  assert.equal(
    createStandaloneShellLoginUrl({
      enabled: false,
      shellOrigin: "https://portal.example.com",
      shellActiveRule: "/maintenance",
      currentPath: "/",
    }),
    "",
  );
  assert.equal(
    createStandaloneShellLoginUrl({
      shellOrigin: "not-a-url",
      shellActiveRule: "/maintenance",
      currentPath: "/",
    }),
    "",
  );
  assert.equal(
    createStandaloneShellLoginUrl({
      shellOrigin: "javascript:alert(1)",
      shellActiveRule: "/maintenance",
      currentPath: "/",
    }),
    "",
  );
  assert.equal(
    createStandaloneShellLoginUrl({
      shellOrigin: "https://portal.example.com",
      shellActiveRule: "/maintenance",
      currentPath: "/",
      loginPath: "//evil.example/login",
    }),
    "",
  );
  assert.equal(
    createStandaloneShellLoginUrl({
      shellOrigin: "https://portal.example.com",
      shellActiveRule: "/maintenance",
      currentPath: "/",
      loginPath: "/\\evil.example/login",
    }),
    "",
  );
});

test("builds a callback URL from the current browser origin without retaining its path", () => {
  assert.equal(
    createBrowserCallbackUrl({
      origin: "http://cyberutopian.local:5173/some/path",
      callbackPath: "/login/callback",
    }),
    "http://cyberutopian.local:5173/login/callback",
  );
  assert.equal(
    createBrowserCallbackUrl({
      origin: "http://cyberutopian.local:5173",
      callbackPath: "https://evil.example/callback",
    }),
    "",
  );
  assert.equal(
    createBrowserCallbackUrl({
      origin: "http://cyberutopian.local:5173",
      callbackPath: "/\\evil.example/callback",
    }),
    "",
  );
  assert.equal(
    createBrowserCallbackUrl({
      origin: "ftp://files.example.com",
      callbackPath: "/login/callback",
    }),
    "",
  );
});

test("is safe when browser globals are unavailable", () => {
  assert.equal(getCurrentRedirectPath(), "/");
  assert.equal(
    createBrowserCallbackUrl({ callbackPath: "/login/callback" }),
    "",
  );
});
