export interface AuthRedirectGate {
  acquire: () => boolean;
  reset: () => void;
}

export interface AuthRedirectGateOptions {
  now?: () => number;
  singleFlightMs?: number;
}

const DEFAULT_SINGLE_FLIGHT_MS = 1_500;

export const createAuthRedirectGate = (
  options: AuthRedirectGateOptions = {},
): AuthRedirectGate => {
  const now = options.now ?? Date.now;
  const singleFlightMs = Math.max(
    0,
    options.singleFlightMs ?? DEFAULT_SINGLE_FLIGHT_MS,
  );
  let blockedUntil = 0;

  return {
    acquire: () => {
      const currentTime = now();
      if (currentTime < blockedUntil) {
        return false;
      }

      blockedUntil = currentTime + singleFlightMs;
      return true;
    },
    reset: () => {
      blockedUntil = 0;
    },
  };
};
