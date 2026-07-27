interface LocalRoute {
  pathname: string;
  search: string;
  hash: string;
}

export interface BrowserLocationLike {
  pathname?: string;
  search?: string;
  hash?: string;
  origin?: string;
}

export interface BrowserCallbackUrlOptions {
  origin?: string;
  callbackPath: string;
}

export interface ShellRedirectPathOptions {
  currentPath?: string;
  shellActiveRule: string;
}

export interface StandaloneShellLoginOptions extends ShellRedirectPathOptions {
  shellOrigin: string;
  enabled?: boolean | string;
  loginPath?: string;
  redirectParam?: string;
}

const getBrowserLocation = (): BrowserLocationLike | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.location;
};

const isLocalPath = (value: string) =>
  value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");

const stripTrailingSlash = (value: string) => {
  if (value === "/") {
    return value;
  }

  return value.replace(/\/+$/, "");
};

const parseLocalRoute = (value?: string): LocalRoute => {
  if (!value || !isLocalPath(value)) {
    return {
      pathname: "/",
      search: "",
      hash: "",
    };
  }

  const hashIndex = value.indexOf("#");
  const routeWithoutHash = hashIndex >= 0 ? value.slice(0, hashIndex) : value;
  const hash = hashIndex >= 0 ? value.slice(hashIndex) : "";
  const searchIndex = routeWithoutHash.indexOf("?");
  const pathname =
    searchIndex >= 0
      ? routeWithoutHash.slice(0, searchIndex)
      : routeWithoutHash;
  const search = searchIndex >= 0 ? routeWithoutHash.slice(searchIndex) : "";

  return {
    pathname: pathname || "/",
    search,
    hash,
  };
};

const normalizeShellActiveRule = (value: string) => {
  const route = parseLocalRoute(value.trim());
  return stripTrailingSlash(route.pathname) || "/";
};

const normalizeOrigin = (value?: string) => {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    return url.origin;
  } catch {
    return "";
  }
};

const isEnabled = (value?: boolean | string) => {
  if (typeof value === "boolean") {
    return value;
  }

  return value?.trim().toLowerCase() !== "false";
};

export const getCurrentRedirectPath = (location = getBrowserLocation()) => {
  if (!location) {
    return "/";
  }

  const pathname =
    location.pathname && isLocalPath(location.pathname)
      ? location.pathname
      : "/";
  const search = location.search?.startsWith("?") ? location.search : "";
  const hash = location.hash?.startsWith("#") ? location.hash : "";

  return `${pathname}${search}${hash}`;
};

export const createBrowserCallbackUrl = ({
  origin,
  callbackPath,
}: BrowserCallbackUrlOptions) => {
  if (!isLocalPath(callbackPath)) {
    return "";
  }

  const browserOrigin = normalizeOrigin(origin ?? getBrowserLocation()?.origin);
  if (!browserOrigin) {
    return "";
  }

  return new URL(callbackPath, browserOrigin).toString();
};

export const createShellRedirectPath = ({
  currentPath,
  shellActiveRule,
}: ShellRedirectPathOptions) => {
  const activeRule = normalizeShellActiveRule(shellActiveRule);
  const route = parseLocalRoute(currentPath);
  const routeSuffix = `${route.search}${route.hash}`;

  if (
    activeRule === "/" ||
    route.pathname === activeRule ||
    route.pathname.startsWith(`${activeRule}/`)
  ) {
    return `${route.pathname}${routeSuffix}`;
  }

  const childPath = route.pathname === "/" ? "" : route.pathname;
  return `${activeRule}${childPath}${routeSuffix}`;
};

export const createStandaloneShellLoginUrl = (
  options: StandaloneShellLoginOptions,
) => {
  if (!isEnabled(options.enabled)) {
    return "";
  }

  const shellOrigin = normalizeOrigin(options.shellOrigin);
  const loginPath = options.loginPath ?? "/login";
  if (!shellOrigin || !isLocalPath(loginPath)) {
    return "";
  }

  const loginUrl = new URL(loginPath, shellOrigin);
  loginUrl.searchParams.set(
    options.redirectParam ?? "redirect",
    createShellRedirectPath(options),
  );

  return loginUrl.toString();
};
