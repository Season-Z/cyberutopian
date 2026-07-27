export interface MicroAppGlobalState {
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
  getAuthToken?: () => string | null | undefined;
  /** @deprecated Child applications should not write host authentication state. */
  setAuthToken?: (token: string) => void;
  /** @deprecated Use onAuthExpired to delegate authentication recovery to the host. */
  clearAuthToken?: () => void;
  onAuthExpired?: (redirectPath?: string) => void;
  onGlobalStateChange?: (
    listener: MicroAppGlobalStateListener<TState>,
    fireImmediately?: boolean,
  ) => void | (() => void);
  offGlobalStateChange?: () => void;
}

export type Awaitable<T> = T | Promise<T>;
