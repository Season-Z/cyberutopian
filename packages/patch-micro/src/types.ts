export interface MicroAppGlobalState {
  accessToken?: string | null;
  /** @deprecated Hosts should publish accessToken instead of a raw token payload. */
  token?: string | null;
  shell?: string;
  updatedAt?: number;
}

export type MicroAppGlobalStateListener<
  TState extends MicroAppGlobalState = MicroAppGlobalState,
> = (state: TState, previousState?: TState) => void;

export interface MicroAppProps<
  TState extends MicroAppGlobalState = MicroAppGlobalState,
> {
  basename?: string;
  routerBase?: string;
  container?: HTMLElement;
  shellName?: string;
  shellTitle?: string;
  getAccessToken?: () => string | null | undefined;
  onAccessTokenExpired?: (redirectPath?: string) => Awaitable<unknown>;
  /** @deprecated Use getAccessToken. */
  getAuthToken?: () => string | null | undefined;
  /** @deprecated Child applications should not write host authentication state. */
  setAuthToken?: (token: string) => void;
  /** @deprecated Use onAuthExpired to delegate authentication recovery to the host. */
  clearAuthToken?: () => void;
  /** @deprecated Use onAccessTokenExpired. */
  onAuthExpired?: (redirectPath?: string) => Awaitable<unknown>;
  onGlobalStateChange?: (
    listener: MicroAppGlobalStateListener<TState>,
    fireImmediately?: boolean,
  ) => void | (() => void);
  offGlobalStateChange?: () => void;
}

export type Awaitable<T> = T | Promise<T>;
