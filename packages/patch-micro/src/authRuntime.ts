import {
  createAuthRedirectGate,
  type AuthRedirectGateOptions,
} from "./authRedirectGate";
import { createShellAuthBridgeUrl, getCurrentRedirectPath } from "./navigation";
import type { MicroAppGlobalState, MicroAppProps } from "./types";

export interface MicroAuthStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export interface MicroAuthFetchResponse {
  ok: boolean;
  json: () => Promise<unknown>;
}

export type MicroAuthFetch = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<MicroAuthFetchResponse>;

export interface MicroAuthRuntimeOptions<
  TState extends MicroAppGlobalState = MicroAppGlobalState,
> extends AuthRedirectGateOptions {
  /** @deprecated Only required while consuming legacy raw-token host props. */
  parseAccessToken?: (rawToken: string) => string;
  shellEntry?: string;
  bridgePath?: string;
  ticketExchangePath?: string;
  ticketParam?: string;
  fetch?: MicroAuthFetch;
  storage?: MicroAuthStorage;
  navigate?: (url: string) => void;
  getCurrentUrl?: () => string;
  replaceCurrentUrl?: (url: string) => void;
  getStandaloneAccessToken?: () => string | null | undefined;
  onStandaloneAuthExpired?: (redirectPath: string) => void;
  getCurrentPath?: () => string;
  selectGlobalAccessToken?: (state: TState) => string | null | undefined;
  /** @deprecated Use selectGlobalAccessToken. */
  selectGlobalToken?: (state: TState) => string | null | undefined;
}

export interface MicroAuthRuntime<
  TState extends MicroAppGlobalState = MicroAppGlobalState,
> {
  setProps: (props?: MicroAppProps<TState>) => void;
  prepare: () => Promise<boolean>;
  getAccessToken: () => string;
  notifyAuthExpired: (redirectPath?: string) => boolean;
  reset: () => void;
}

interface RuntimeLocation {
  currentUrl: URL;
  shellUrl: URL;
  storageKey: string;
}

const DEFAULT_TICKET_PARAM = "__patch_micro_ticket";
const DEFAULT_TICKET_EXCHANGE_PATH = "/api/v1/user/login/micro/ticket/exchange";

export const createMicroAuthRuntime = <
  TState extends MicroAppGlobalState = MicroAppGlobalState,
>(
  options: MicroAuthRuntimeOptions<TState> = {},
): MicroAuthRuntime<TState> => {
  const redirectGate = createAuthRedirectGate(options);
  let props: MicroAppProps<TState> = {};
  let accessToken = "";
  let hosted = false;
  let globalStateSource: MicroAppProps<TState>["onGlobalStateChange"];
  let globalStateOff: MicroAppProps<TState>["offGlobalStateChange"];
  let unsubscribeGlobalState: (() => void) | undefined;

  const parseLegacyToken = (value: string | null | undefined) => {
    if (!value) {
      return "";
    }

    try {
      return options.parseAccessToken?.(value) || value;
    } catch {
      return "";
    }
  };

  const setAccessToken = (value: string | null | undefined) => {
    accessToken = typeof value === "string" ? value : "";
    if (accessToken) {
      redirectGate.reset();
    }
  };

  const readHostAccessToken = (nextProps: MicroAppProps<TState>) => {
    try {
      if (nextProps.getAccessToken) {
        return nextProps.getAccessToken() || "";
      }

      return parseLegacyToken(nextProps.getAuthToken?.());
    } catch {
      return "";
    }
  };

  const readStandaloneAccessToken = () => {
    try {
      return options.getStandaloneAccessToken?.() || "";
    } catch {
      return "";
    }
  };

  const selectGlobalAccessToken = (state: TState) => {
    try {
      if (options.selectGlobalAccessToken) {
        return options.selectGlobalAccessToken(state);
      }

      if (Object.prototype.hasOwnProperty.call(state, "accessToken")) {
        return state.accessToken === undefined ? undefined : state.accessToken;
      }

      if (options.selectGlobalToken) {
        const legacyToken = options.selectGlobalToken(state);
        return legacyToken === undefined
          ? undefined
          : parseLegacyToken(legacyToken);
      }

      if (
        !Object.prototype.hasOwnProperty.call(state, "token") ||
        state.token === undefined
      ) {
        return undefined;
      }

      return parseLegacyToken(state.token);
    } catch {
      return undefined;
    }
  };

  const getBrowserStorage = () => {
    if (options.storage) {
      return options.storage;
    }

    if (typeof window === "undefined") {
      return undefined;
    }

    try {
      return window.sessionStorage;
    } catch {
      return undefined;
    }
  };

  const getCurrentUrl = () => {
    if (options.getCurrentUrl) {
      return options.getCurrentUrl();
    }

    return typeof window === "undefined" ? "" : window.location.href;
  };

  const getRuntimeLocation = (): RuntimeLocation | undefined => {
    try {
      const currentUrl = new URL(getCurrentUrl());
      const shellUrl = new URL(options.shellEntry || "");
      if (
        !["http:", "https:"].includes(currentUrl.protocol) ||
        !["http:", "https:"].includes(shellUrl.protocol)
      ) {
        return undefined;
      }

      return {
        currentUrl,
        shellUrl,
        storageKey: `@cyberutopian/patch-micro:access:${encodeURIComponent(shellUrl.origin)}:${encodeURIComponent(currentUrl.origin)}`,
      };
    } catch {
      return undefined;
    }
  };

  const clearStandaloneAccessToken = () => {
    const runtimeLocation = getRuntimeLocation();
    if (!runtimeLocation) {
      return;
    }

    try {
      getBrowserStorage()?.removeItem(runtimeLocation.storageKey);
    } catch {
      // Storage can be disabled without breaking hosted applications.
    }
  };

  const persistStandaloneAccessToken = (value: string) => {
    const runtimeLocation = getRuntimeLocation();
    if (!runtimeLocation) {
      return;
    }

    try {
      getBrowserStorage()?.setItem(runtimeLocation.storageKey, value);
    } catch {
      // Keep the in-memory access token when storage is unavailable.
    }
  };

  const readPersistedStandaloneAccessToken = () => {
    const runtimeLocation = getRuntimeLocation();
    if (!runtimeLocation) {
      return "";
    }

    try {
      return getBrowserStorage()?.getItem(runtimeLocation.storageKey) || "";
    } catch {
      return "";
    }
  };

  const replaceCurrentUrl = (url: string) => {
    if (options.replaceCurrentUrl) {
      options.replaceCurrentUrl(url);
      return;
    }

    if (typeof window !== "undefined") {
      window.history.replaceState(window.history.state, "", url);
    }
  };

  const navigate = (url: string) => {
    if (options.navigate) {
      options.navigate(url);
      return;
    }

    if (typeof window !== "undefined") {
      window.location.replace(url);
    }
  };

  const createBridgeUrl = (redirectPath?: string) => {
    const runtimeLocation = getRuntimeLocation();
    if (!runtimeLocation) {
      return "";
    }

    return createShellAuthBridgeUrl({
      shellEntry: runtimeLocation.shellUrl.toString(),
      targetOrigin: runtimeLocation.currentUrl.origin,
      currentPath:
        redirectPath ||
        `${runtimeLocation.currentUrl.pathname}${runtimeLocation.currentUrl.search}${runtimeLocation.currentUrl.hash}`,
      bridgePath: options.bridgePath,
    });
  };

  const redirectToBridge = (redirectPath?: string) => {
    const bridgeUrl = createBridgeUrl(redirectPath);
    if (!bridgeUrl || !redirectGate.acquire()) {
      return false;
    }

    navigate(bridgeUrl);
    return true;
  };

  const getFetch = (): MicroAuthFetch | undefined => {
    if (options.fetch) {
      return options.fetch;
    }

    if (typeof globalThis.fetch !== "function") {
      return undefined;
    }

    return (url, init) => globalThis.fetch(url, init);
  };

  const exchangeStandaloneTicket = async (ticket: string) => {
    const runtimeLocation = getRuntimeLocation();
    const fetcher = getFetch();
    if (!runtimeLocation || !fetcher) {
      return "";
    }

    const exchangePath =
      options.ticketExchangePath || DEFAULT_TICKET_EXCHANGE_PATH;
    if (
      !exchangePath.startsWith("/") ||
      exchangePath.startsWith("//") ||
      exchangePath.includes("\\")
    ) {
      return "";
    }

    const exchangeUrl = new URL(
      exchangePath,
      runtimeLocation.shellUrl.origin,
    ).toString();
    const response = await fetcher(exchangeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket }),
    });
    if (!response.ok) {
      return "";
    }

    const payload = (await response.json()) as {
      code?: unknown;
      data?: { access_token?: unknown };
    };
    if (
      (payload.code !== 0 && payload.code !== "0") ||
      typeof payload.data?.access_token !== "string"
    ) {
      return "";
    }

    return payload.data.access_token;
  };

  const cleanupGlobalStateSubscription = () => {
    try {
      unsubscribeGlobalState?.();
    } catch {
      // Authentication cleanup must remain safe during application unmount.
    }
    unsubscribeGlobalState = undefined;
  };

  const setProps = (nextProps: MicroAppProps<TState> = {}) => {
    const nextGlobalStateSource = nextProps.onGlobalStateChange;
    const nextGlobalStateOff = nextProps.offGlobalStateChange;
    const sourceChanged =
      nextGlobalStateSource !== globalStateSource ||
      nextGlobalStateOff !== globalStateOff;

    if (sourceChanged) {
      cleanupGlobalStateSubscription();
      globalStateSource = nextGlobalStateSource;
      globalStateOff = nextGlobalStateOff;
    }

    props = nextProps;
    hosted = Boolean(
      nextProps.getAccessToken ||
        nextProps.getAuthToken ||
        nextProps.onAccessTokenExpired ||
        nextProps.onAuthExpired ||
        nextGlobalStateSource,
    );
    if (
      nextProps.getAccessToken ||
      nextProps.getAuthToken ||
      sourceChanged ||
      !nextGlobalStateSource
    ) {
      setAccessToken(readHostAccessToken(nextProps));
    }

    if (sourceChanged && nextGlobalStateSource) {
      unsubscribeGlobalState = nextGlobalStateOff;
      const cleanup = nextGlobalStateSource((state) => {
        const nextToken = selectGlobalAccessToken(state);
        if (nextToken !== undefined) {
          setAccessToken(nextToken);
        }
      }, true);

      if (typeof cleanup === "function") {
        unsubscribeGlobalState = cleanup;
      }
    }
  };

  const reset = () => {
    cleanupGlobalStateSubscription();
    props = {};
    accessToken = "";
    hosted = false;
    globalStateSource = undefined;
    globalStateOff = undefined;
    redirectGate.reset();
  };

  return {
    setProps,
    prepare: async () => {
      if (hosted) {
        return true;
      }

      const runtimeLocation = getRuntimeLocation();
      if (!runtimeLocation) {
        const standaloneAccessToken = readStandaloneAccessToken();
        setAccessToken(standaloneAccessToken);
        return Boolean(standaloneAccessToken);
      }

      const ticketParam = options.ticketParam || DEFAULT_TICKET_PARAM;
      const ticket = runtimeLocation.currentUrl.searchParams.get(ticketParam);
      if (ticket) {
        runtimeLocation.currentUrl.searchParams.delete(ticketParam);
        replaceCurrentUrl(runtimeLocation.currentUrl.toString());

        try {
          const exchangedToken = await exchangeStandaloneTicket(ticket);
          if (exchangedToken) {
            setAccessToken(exchangedToken);
            persistStandaloneAccessToken(exchangedToken);
            return true;
          }
        } catch {
          // A failed one-time ticket is recovered through a fresh shell roundtrip.
        }

        clearStandaloneAccessToken();
        setAccessToken("");
        redirectToBridge();
        return false;
      }

      const storedToken =
        readPersistedStandaloneAccessToken() || readStandaloneAccessToken();
      if (storedToken) {
        setAccessToken(storedToken);
        return true;
      }

      redirectToBridge();
      return false;
    },
    getAccessToken: () =>
      accessToken ||
      (!hosted ? readPersistedStandaloneAccessToken() : "") ||
      readStandaloneAccessToken(),
    notifyAuthExpired: (redirectPath) => {
      accessToken = "";
      if (!hosted) {
        clearStandaloneAccessToken();
      }

      let targetPath = redirectPath;
      if (!targetPath) {
        try {
          targetPath = options.getCurrentPath?.() || getCurrentRedirectPath();
        } catch {
          targetPath = getCurrentRedirectPath();
        }
      }

      const handler =
        props.onAccessTokenExpired ??
        props.onAuthExpired ??
        options.onStandaloneAuthExpired;
      if (handler) {
        if (!redirectGate.acquire()) {
          return false;
        }

        void handler(targetPath);
        return true;
      }

      return hosted ? false : redirectToBridge(targetPath);
    },
    reset,
  };
};
