import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

type MicroAppProps = import("../src/index").MicroAppProps;

const require = createRequire(import.meta.url);
const { createMicroLifecycle } =
  require("../dist/index.js") as typeof import("../src/index");

test("syncs props before mount and update and resets after unmount", async () => {
  const calls: string[] = [];
  const authRuntime = {
    setProps: (props: MicroAppProps) => {
      calls.push(`props:${props.basename}`);
    },
    reset: () => {
      calls.push("reset");
    },
  };
  const lifecycle = createMicroLifecycle({
    authRuntime,
    bootstrap: () => {
      calls.push("bootstrap");
    },
    mount: (props) => {
      calls.push(`mount:${props.basename}`);
    },
    update: (props) => {
      calls.push(`update:${props.basename}`);
    },
    unmount: () => {
      calls.push("unmount");
    },
  });

  await lifecycle.bootstrap({ basename: "/maintenance" });
  await lifecycle.mount({ basename: "/maintenance" });
  await lifecycle.update({ basename: "/maintenance/device" });
  await lifecycle.unmount({ basename: "/maintenance/device" });

  assert.deepEqual(calls, [
    "bootstrap",
    "props:/maintenance",
    "mount:/maintenance",
    "props:/maintenance/device",
    "update:/maintenance/device",
    "unmount",
    "reset",
  ]);
});

test("waits for auth preparation and skips rendering when navigation starts", async () => {
  const calls: string[] = [];
  const lifecycle = createMicroLifecycle({
    authRuntime: {
      setProps: () => {
        calls.push("props");
      },
      prepare: async () => {
        calls.push("prepare");
        return false;
      },
      reset: () => {
        calls.push("reset");
      },
    },
    mount: () => {
      calls.push("mount");
    },
  });

  await lifecycle.mount({});

  assert.deepEqual(calls, ["props", "prepare"]);
});

test("rolls back auth state when mount fails", async () => {
  let resets = 0;
  const lifecycle = createMicroLifecycle({
    authRuntime: {
      setProps: () => undefined,
      reset: () => {
        resets += 1;
      },
    },
    mount: () => {
      throw new Error("mount failed");
    },
  });

  await assert.rejects(lifecycle.mount({}), /mount failed/);
  assert.equal(resets, 1);
});

test("rolls back auth state when prop synchronization fails", async () => {
  let resets = 0;
  const lifecycle = createMicroLifecycle({
    authRuntime: {
      setProps: () => {
        throw new Error("props failed");
      },
      reset: () => {
        resets += 1;
      },
    },
    mount: () => undefined,
  });

  await assert.rejects(lifecycle.mount({}), /props failed/);
  assert.equal(resets, 1);
});

test("always resets auth state and preserves the unmount error", async () => {
  let resets = 0;
  const lifecycle = createMicroLifecycle({
    authRuntime: {
      setProps: () => undefined,
      reset: () => {
        resets += 1;
      },
    },
    mount: () => undefined,
    unmount: () => {
      throw new Error("unmount failed");
    },
  });

  await assert.rejects(lifecycle.unmount({}), /unmount failed/);
  assert.equal(resets, 1);
});

test("preserves a falsy unmount rejection while still resetting auth state", async () => {
  let resets = 0;
  const lifecycle = createMicroLifecycle({
    authRuntime: {
      setProps: () => undefined,
      reset: () => {
        resets += 1;
      },
    },
    mount: () => undefined,
    unmount: () => {
      throw null;
    },
  });
  let rejection: unknown = Symbol("not rejected");

  try {
    await lifecycle.unmount({});
  } catch (error) {
    rejection = error;
  }

  assert.equal(rejection, null);
  assert.equal(resets, 1);
});
