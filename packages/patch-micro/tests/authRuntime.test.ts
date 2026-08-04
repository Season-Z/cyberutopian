import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

type MicroAppGlobalState = import("../src/index").MicroAppGlobalState;
type MicroAppProps = import("../src/index").MicroAppProps;

const require = createRequire(import.meta.url);
const { createMicroAuthRuntime } =
  require("../dist/index.js") as typeof import("../src/index");

const parseAccessToken = (raw: string) => {
  const value = JSON.parse(raw) as { access_token?: unknown };
  return typeof value.access_token === "string" ? value.access_token : "";
};

const createRawToken = (accessToken: string) =>
  JSON.stringify({
    access_token: accessToken,
    refresh_token: "server-only-in-future",
  });

const createMemoryStorage = () => {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
    values,
  };
};

test("reads an access-token-first host contract without a token parser", () => {
  let listener: ((state: MicroAppGlobalState) => void) | undefined;
  let expiredPath = "";
  const runtime = createMicroAuthRuntime();

  runtime.setProps({
    getAccessToken: () => "host-access-token",
    onAccessTokenExpired: (path) => {
      expiredPath = path || "";
    },
    onGlobalStateChange: (nextListener) => {
      listener = nextListener;
    },
  });

  assert.equal(runtime.getAccessToken(), "host-access-token");
  listener?.({ accessToken: "updated-access-token" });
  assert.equal(runtime.getAccessToken(), "updated-access-token");
  assert.equal(runtime.notifyAuthExpired("/device/list"), true);
  assert.equal(expiredPath, "/device/list");
});

test("exchanges a standalone bridge ticket and stores only the access token", async () => {
  const storage = createMemoryStorage();
  const replacedUrls: string[] = [];
  const requestedUrls: string[] = [];
  const runtime = createMicroAuthRuntime({
    shellEntry: "https://mid-test.patch-x.cn/maintenance",
    getCurrentUrl: () =>
      "http://cyberutopian.local:5173/device/list?__patch_micro_ticket=one-time&page=2#row-8",
    replaceCurrentUrl: (url) => {
      replacedUrls.push(url);
    },
    storage,
    fetch: async (url, init) => {
      requestedUrls.push(url);
      assert.equal(init?.method, "POST");
      assert.deepEqual(JSON.parse(String(init?.body)), { ticket: "one-time" });

      return {
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            access_token: "standalone-access-token",
            return_to: "/device/list?page=2#row-8",
          },
        }),
      };
    },
  });

  assert.equal(await runtime.prepare(), true);
  assert.equal(runtime.getAccessToken(), "standalone-access-token");
  assert.deepEqual(requestedUrls, [
    "https://mid-test.patch-x.cn/api/v1/user/login/micro/ticket/exchange",
  ]);
  assert.deepEqual(replacedUrls, [
    "http://cyberutopian.local:5173/device/list?page=2#row-8",
  ]);
  assert.equal(
    [...storage.values.values()].some((value) => value.includes("refresh")),
    false,
  );
});

test("redirects standalone access to the shell bridge and preserves the local route", async () => {
  const navigations: string[] = [];
  const runtime = createMicroAuthRuntime({
    shellEntry: "https://mid-test.patch-x.cn/maintenance",
    getCurrentUrl: () =>
      "http://cyberutopian.local:5173/device/list?page=2#row-8",
    navigate: (url) => {
      navigations.push(url);
    },
    storage: createMemoryStorage(),
  });

  assert.equal(await runtime.prepare(), false);
  assert.deepEqual(navigations, [
    "https://mid-test.patch-x.cn/auth/bridge?target_origin=http%3A%2F%2Fcyberutopian.local%3A5173&return_to=%2Fdevice%2Flist%3Fpage%3D2%23row-8",
  ]);
});

test("does not prepare an unauthenticated standalone app without a shell entry", async () => {
  const runtime = createMicroAuthRuntime();

  runtime.setProps({});

  assert.equal(await runtime.prepare(), false);
  assert.equal(runtime.getAccessToken(), "");
});

test("does not send a bridge ticket to an external exchange path", async () => {
  let requests = 0;
  const runtime = createMicroAuthRuntime({
    shellEntry: "https://mid-test.patch-x.cn/maintenance",
    ticketExchangePath: "https://evil.example/exchange",
    getCurrentUrl: () =>
      "http://cyberutopian.local:5173/device/list?__patch_micro_ticket=one-time",
    replaceCurrentUrl: () => undefined,
    navigate: () => undefined,
    fetch: async () => {
      requests += 1;
      return { ok: true, json: async () => ({}) };
    },
  });

  assert.equal(await runtime.prepare(), false);
  assert.equal(requests, 0);
});

test("clears standalone access and single-flights bridge redirects after 401", async () => {
  const storage = createMemoryStorage();
  const navigations: string[] = [];
  let currentUrl =
    "http://cyberutopian.local:5173/device/list?__patch_micro_ticket=temporary";
  const runtime = createMicroAuthRuntime({
    shellEntry: "https://mid-test.patch-x.cn/maintenance",
    getCurrentUrl: () => currentUrl,
    replaceCurrentUrl: (url) => {
      currentUrl = url;
    },
    navigate: (url) => {
      navigations.push(url);
    },
    storage,
    fetch: async () => ({
      ok: true,
      json: async () => ({
        code: 0,
        data: { access_token: "temporary-token", return_to: "/device/list" },
      }),
    }),
  });

  runtime.setProps({});
  assert.equal(await runtime.prepare(), true);
  assert.equal(runtime.notifyAuthExpired("/device/list"), true);
  assert.equal(runtime.notifyAuthExpired("/device/list"), false);
  assert.equal(runtime.getAccessToken(), "");
  assert.equal(storage.values.size, 0);
  assert.equal(navigations.length, 1);
});

test("reads a host token and never invokes deprecated token writers", () => {
  let setCalls = 0;
  let clearCalls = 0;
  const runtime = createMicroAuthRuntime({ parseAccessToken });

  runtime.setProps({
    getAuthToken: () => createRawToken("host-token"),
    setAuthToken: () => {
      setCalls += 1;
    },
    clearAuthToken: () => {
      clearCalls += 1;
    },
  });

  assert.equal(runtime.getAccessToken(), "host-token");
  runtime.notifyAuthExpired("/device/list");
  assert.equal(setCalls, 0);
  assert.equal(clearCalls, 0);
});

test("uses standalone access token when the host token is empty or invalid", () => {
  const runtime = createMicroAuthRuntime({
    parseAccessToken,
    getStandaloneAccessToken: () => "standalone-token",
  });

  runtime.setProps({ getAuthToken: () => "invalid-json" });

  assert.equal(runtime.getAccessToken(), "standalone-token");
});

test("contains host getter, token parser and standalone getter failures", () => {
  const runtime = createMicroAuthRuntime({
    parseAccessToken: () => {
      throw new Error("bad token");
    },
    getStandaloneAccessToken: () => {
      throw new Error("storage denied");
    },
  });

  runtime.setProps({
    getAuthToken: () => {
      throw new Error("host unavailable");
    },
  });

  assert.equal(runtime.getAccessToken(), "");
});

test("updates token from global state and resets the redirect gate", () => {
  let now = 1_000;
  let listener: ((state: MicroAppGlobalState) => void) | undefined;
  let expiredCalls = 0;
  const runtime = createMicroAuthRuntime({
    parseAccessToken,
    now: () => now,
    singleFlightMs: 1_500,
  });

  runtime.setProps({
    onAuthExpired: () => {
      expiredCalls += 1;
    },
    onGlobalStateChange: (nextListener) => {
      listener = nextListener;
    },
  });

  assert.equal(runtime.notifyAuthExpired("/one"), true);
  assert.equal(runtime.notifyAuthExpired("/two"), false);
  assert.equal(expiredCalls, 1);

  listener?.({ token: createRawToken("fresh-token") });

  assert.equal(runtime.getAccessToken(), "fresh-token");
  assert.equal(runtime.notifyAuthExpired("/three"), true);
  assert.equal(expiredCalls, 2);

  now += 1_501;
  assert.equal(runtime.notifyAuthExpired("/four"), true);
});

test("clears a global token when the host publishes an explicit logout value", () => {
  type NullableTokenState = Omit<MicroAppGlobalState, "token"> & {
    token?: string | null;
  };
  let listener: ((state: NullableTokenState) => void) | undefined;
  const runtime = createMicroAuthRuntime<NullableTokenState>({
    parseAccessToken,
  });

  runtime.setProps({
    onGlobalStateChange: (nextListener) => {
      listener = nextListener;
    },
  });
  listener?.({ token: createRawToken("host-token") });
  assert.equal(runtime.getAccessToken(), "host-token");

  listener?.({ token: null });

  assert.equal(runtime.getAccessToken(), "");
});

test("preserves a global token when the host publishes token as undefined", () => {
  let listener: ((state: MicroAppGlobalState) => void) | undefined;
  const runtime = createMicroAuthRuntime({ parseAccessToken });

  runtime.setProps({
    onGlobalStateChange: (nextListener) => {
      listener = nextListener;
    },
  });
  listener?.({ token: createRawToken("host-token") });
  listener?.({ token: undefined });

  assert.equal(runtime.getAccessToken(), "host-token");
});

test("preserves a global token across updates with the same subscription source", () => {
  let listener: ((state: MicroAppGlobalState) => void) | undefined;
  const stateSource: NonNullable<MicroAppProps["onGlobalStateChange"]> = (
    nextListener,
  ) => {
    listener = nextListener;
  };
  const runtime = createMicroAuthRuntime({ parseAccessToken });

  runtime.setProps({ onGlobalStateChange: stateSource });
  listener?.({ token: createRawToken("global-token") });
  runtime.setProps({ onGlobalStateChange: stateSource });

  assert.equal(runtime.getAccessToken(), "global-token");
});

test("prefers the host expiry handler and falls back to standalone handling", () => {
  const paths: string[] = [];
  const runtime = createMicroAuthRuntime({
    parseAccessToken,
    getCurrentPath: () => "/current?page=2#row",
    onStandaloneAuthExpired: (path) => paths.push(`standalone:${path}`),
    singleFlightMs: 0,
  });

  runtime.setProps({
    onAuthExpired: (path) => paths.push(`host:${path}`),
  });
  assert.equal(runtime.notifyAuthExpired(), true);

  runtime.setProps({});
  assert.equal(runtime.notifyAuthExpired("/standalone"), true);

  assert.deepEqual(paths, [
    "host:/current?page=2#row",
    "standalone:/standalone",
  ]);
});

test("returns false when no expiry handler is configured", () => {
  const runtime = createMicroAuthRuntime({ parseAccessToken });

  assert.equal(runtime.notifyAuthExpired("/device/list"), false);
});

test("does not duplicate a subscription and cleans it up when the source changes or resets", () => {
  let firstRegistrations = 0;
  let firstCleanups = 0;
  let secondRegistrations = 0;
  let secondCleanups = 0;
  const firstSource: NonNullable<MicroAppProps["onGlobalStateChange"]> = () => {
    firstRegistrations += 1;
    return () => {
      firstCleanups += 1;
    };
  };
  const secondSource: NonNullable<
    MicroAppProps["onGlobalStateChange"]
  > = () => {
    secondRegistrations += 1;
    return () => {
      secondCleanups += 1;
    };
  };
  const runtime = createMicroAuthRuntime({ parseAccessToken });

  runtime.setProps({ onGlobalStateChange: firstSource });
  runtime.setProps({ onGlobalStateChange: firstSource });
  runtime.setProps({ onGlobalStateChange: secondSource });
  runtime.reset();

  assert.equal(firstRegistrations, 1);
  assert.equal(firstCleanups, 1);
  assert.equal(secondRegistrations, 1);
  assert.equal(secondCleanups, 1);
});

test("uses a qiankun-style offGlobalStateChange callback when registration returns void", () => {
  let cleanups = 0;
  const props: MicroAppProps & { offGlobalStateChange: () => void } = {
    onGlobalStateChange: () => undefined,
    offGlobalStateChange: () => {
      cleanups += 1;
    },
  };
  const runtime = createMicroAuthRuntime({ parseAccessToken });

  runtime.setProps(props);
  runtime.reset();

  assert.equal(cleanups, 1);
});

test("retains the qiankun cleanup callback when state registration throws", () => {
  let cleanups = 0;
  const runtime = createMicroAuthRuntime({ parseAccessToken });

  assert.throws(
    () =>
      runtime.setProps({
        onGlobalStateChange: () => {
          throw new Error("registration failed");
        },
        offGlobalStateChange: () => {
          cleanups += 1;
        },
      }),
    /registration failed/,
  );
  runtime.reset();

  assert.equal(cleanups, 1);
});
