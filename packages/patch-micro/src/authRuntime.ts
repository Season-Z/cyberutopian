import {
  createAuthRedirectGate,
  type AuthRedirectGateOptions,
} from "./authRedirectGate";
import { getCurrentRedirectPath } from "./navigation";
import type { MicroAppGlobalState, MicroAppProps } from "./types";

export interface MicroAuthRuntimeOptions<
  TState extends MicroAppGlobalState = MicroAppGlobalState,
> extends AuthRedirectGateOptions {
  parseAccessToken: (rawToken: string) => string;
  getStandaloneAccessToken?: () => string | null | undefined;
  onStandaloneAuthExpired?: (redirectPath: string) => void;
  getCurrentPath?: () => string;
  selectGlobalToken?: (state: TState) => string | null | undefined;
}

export interface MicroAuthRuntime<
  TState extends MicroAppGlobalState = MicroAppGlobalState,
> {
  setProps: (props?: MicroAppProps<TState>) => void;
  getAccessToken: () => string;
  notifyAuthExpired: (redirectPath?: string) => boolean;
  reset: () => void;
}

export const createMicroAuthRuntime = <
  TState extends MicroAppGlobalState = MicroAppGlobalState,
>(
  options: MicroAuthRuntimeOptions<TState>,
): MicroAuthRuntime<TState> => {
  const redirectGate = createAuthRedirectGate(options);
  let props: MicroAppProps<TState> = {};
  let tokenRaw = "";
  let globalStateSource: MicroAppProps<TState>["onGlobalStateChange"];
  let globalStateOff: MicroAppProps<TState>["offGlobalStateChange"];
  let unsubscribeGlobalState: (() => void) | undefined;

  const parseToken = (value: string | null | undefined) => {
    if (!value) {
      return "";
    }

    try {
      return options.parseAccessToken(value) || "";
    } catch {
      return "";
    }
  };

  const setTokenRaw = (value: string | null | undefined) => {
    if (!parseToken(value)) {
      tokenRaw = "";
      return;
    }

    tokenRaw = value || "";
    redirectGate.reset();
  };

  const readHostToken = (nextProps: MicroAppProps<TState>) => {
    try {
      return nextProps.getAuthToken?.() || "";
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

  const selectGlobalToken = (state: TState) => {
    try {
      if (options.selectGlobalToken) {
        return options.selectGlobalToken(state);
      }

      if (
        !Object.prototype.hasOwnProperty.call(state, "token") ||
        state.token === undefined
      ) {
        return undefined;
      }

      return state.token;
    } catch {
      return undefined;
    }
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
    if (nextProps.getAuthToken || sourceChanged || !nextGlobalStateSource) {
      setTokenRaw(readHostToken(nextProps));
    }

    if (sourceChanged && nextGlobalStateSource) {
      unsubscribeGlobalState = nextGlobalStateOff;
      const cleanup = nextGlobalStateSource((state) => {
        const nextToken = selectGlobalToken(state);
        if (nextToken !== undefined) {
          setTokenRaw(nextToken);
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
    tokenRaw = "";
    globalStateSource = undefined;
    globalStateOff = undefined;
    redirectGate.reset();
  };

  return {
    setProps,
    getAccessToken: () => parseToken(tokenRaw) || readStandaloneAccessToken(),
    notifyAuthExpired: (redirectPath) => {
      tokenRaw = "";
      const handler = props.onAuthExpired ?? options.onStandaloneAuthExpired;

      if (!handler || !redirectGate.acquire()) {
        return false;
      }

      let targetPath = redirectPath;
      if (!targetPath) {
        try {
          targetPath = options.getCurrentPath?.() || getCurrentRedirectPath();
        } catch {
          targetPath = getCurrentRedirectPath();
        }
      }

      handler(targetPath);
      return true;
    },
    reset,
  };
};
