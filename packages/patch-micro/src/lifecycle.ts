import type { Awaitable, MicroAppProps } from "./types";

export interface MicroLifecycleAuthRuntime<
  TProps extends MicroAppProps = MicroAppProps,
> {
  setProps: (props: TProps) => void;
  reset: () => void;
}

export interface MicroLifecycleOptions<
  TProps extends MicroAppProps = MicroAppProps,
> {
  authRuntime?: MicroLifecycleAuthRuntime<TProps>;
  bootstrap?: (props: TProps) => Awaitable<void>;
  mount: (props: TProps) => Awaitable<void>;
  update?: (props: TProps) => Awaitable<void>;
  unmount?: (props: TProps) => Awaitable<void>;
}

export interface MicroLifecycle<TProps extends MicroAppProps = MicroAppProps> {
  bootstrap: (props: TProps) => Promise<void>;
  mount: (props: TProps) => Promise<void>;
  update: (props: TProps) => Promise<void>;
  unmount: (props: TProps) => Promise<void>;
}

const resetWithoutMaskingError = (
  runtime: Pick<MicroLifecycleAuthRuntime, "reset"> | undefined,
) => {
  try {
    runtime?.reset();
  } catch {
    // Preserve the lifecycle error that initiated cleanup.
  }
};

export const createMicroLifecycle = <
  TProps extends MicroAppProps = MicroAppProps,
>(
  options: MicroLifecycleOptions<TProps>,
): MicroLifecycle<TProps> => ({
  bootstrap: async (props) => {
    await options.bootstrap?.(props);
  },
  mount: async (props) => {
    try {
      options.authRuntime?.setProps(props);
      await options.mount(props);
    } catch (error) {
      resetWithoutMaskingError(options.authRuntime);
      throw error;
    }
  },
  update: async (props) => {
    options.authRuntime?.setProps(props);
    await options.update?.(props);
  },
  unmount: async (props) => {
    let lifecycleFailed = false;
    let lifecycleError: unknown;

    try {
      await options.unmount?.(props);
    } catch (error) {
      lifecycleFailed = true;
      lifecycleError = error;
    }

    if (lifecycleFailed) {
      resetWithoutMaskingError(options.authRuntime);
      throw lifecycleError;
    }

    options.authRuntime?.reset();
  },
});
