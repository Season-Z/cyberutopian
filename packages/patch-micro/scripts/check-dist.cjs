const assert = require("node:assert/strict");
const runtime = require("../dist/index.js");

const expectedExports = [
  "createAuthRedirectGate",
  "createBrowserCallbackUrl",
  "createMicroAuthRuntime",
  "createMicroLifecycle",
  "createShellRedirectPath",
  "createStandaloneShellLoginUrl",
  "getCurrentRedirectPath",
  "resolveMicroAppMountElement",
];

for (const exportName of expectedExports) {
  assert.equal(
    typeof runtime[exportName],
    "function",
    `${exportName} must be a CommonJS function export`,
  );
}
