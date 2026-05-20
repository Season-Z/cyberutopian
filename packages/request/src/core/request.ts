import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import axios from "axios";
import { axiosErrorMap } from "../utils/config";
import { getRequestIdentifier as getAxiosRequestIdentifier } from "../utils/constants";
import type {
  ApiErrorCode,
  CreateRequestConfig,
  HttpMethod,
  MessageOptions,
  QueryParams,
  RequestAdapter,
  RequestConfig,
  RequestInterceptors,
  RequestResponse,
  ResolvedRequestConfig,
  ResponseHandlers,
} from "./interface";

const defaultTimeout = 1000 * 30;

export class ApiError extends Error {
  code?: ApiErrorCode;
  config?: ResolvedRequestConfig;
  data?: unknown;
  response?: Response;
  status: number;

  constructor(
    message: string,
    status: number,
    options: {
      code?: ApiErrorCode;
      config?: ResolvedRequestConfig<any>;
      data?: unknown;
      response?: Response;
    } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options.code;
    this.config = options.config;
    this.data = options.data;
    this.response = options.response;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export class Request {
  // axios 实例；在 React Native/Expo 下会自动切到 fetch，此时为 null。
  instance: AxiosInstance | null;
  // 拦截器对象
  interceptorsObj?: RequestInterceptors<AxiosResponse>;
  // * 存放取消请求控制器Map
  abortControllerMap: Map<string, AbortController>;
  // * 提示函数
  message?: (options: MessageOptions) => void;
  // * handlers
  handlers?: ResponseHandlers<any>;
  private baseURL?: string;
  private defaultHeaders?:
    | AxiosRequestConfig["headers"]
    | HeadersInit
    | Record<string, string>;
  private requestAdapter: Exclude<RequestAdapter, "auto">;
  private timeout: number;
  private withCredentials?: boolean;

  constructor(config: CreateRequestConfig = {}) {
    const { requestAdapter, ...axiosConfig } = config;

    this.requestAdapter = resolveRequestAdapter(requestAdapter);
    this.instance =
      this.requestAdapter === "axios" ? axios.create(axiosConfig) : null;
    // * 初始化存放取消请求控制器Map
    this.abortControllerMap = new Map();
    this.interceptorsObj = config.interceptors;
    this.message = config.message || getGlobalMessage();
    this.handlers = config.handlers || {};
    this.baseURL = config.baseURL;
    this.defaultHeaders = config.headers as
      | AxiosRequestConfig["headers"]
      | HeadersInit
      | Record<string, string>;
    this.timeout = config.timeout ?? defaultTimeout;
    this.withCredentials = config.withCredentials;

    if (this.instance) {
      this.setupAxiosInterceptors();
    }
  }

  request<D, T>(config: RequestConfig<T>): Promise<T> {
    if (this.requestAdapter === "fetch") {
      return this.fetchRequest<D, T>(config);
    }

    return this.axiosRequest<D, T>(config);
  }

  /**
   * 取消全部请求
   */
  cancelAllRequest() {
    for (const [, controller] of this.abortControllerMap) {
      controller.abort();
    }
    this.abortControllerMap.clear();
  }

  /**
   * 取消指定的请求
   * @param url 待取消的请求URL
   */
  cancelRequest(url: string | string[]) {
    const urlList = Array.isArray(url) ? url : [url];
    for (const _url of urlList) {
      for (const [identifier, controller] of this.abortControllerMap) {
        if (
          identifier === _url ||
          identifier.endsWith(`-${_url}`) ||
          identifier.endsWith(`-${buildURL(this.baseURL, _url)}`)
        ) {
          controller.abort();
          this.abortControllerMap.delete(identifier);
        }
      }
    }
  }

  private setupAxiosInterceptors() {
    if (!this.instance) return;

    // 拦截器执行顺序 接口请求 -> 实例请求 -> 全局请求 -> 实例响应 -> 全局响应 -> 接口响应
    this.instance.interceptors.request.use(
      (res: InternalAxiosRequestConfig) => {
        if (
          hasCancelPendingFlag(res?.data) ||
          hasCancelPendingFlag(res?.params)
        ) {
          const identifier = getAxiosRequestIdentifier(res);
          if (!identifier) return res;
          // 请求发起前取消之前的请求
          if (this.abortControllerMap.has(identifier)) {
            const previousController = this.abortControllerMap.get(identifier);
            previousController?.abort(); // 取消之前的请求
            this.abortControllerMap.delete(identifier); // 从映射中移除
          }
          // 存储取消请求的标识
          const controller = new AbortController();
          res.signal = controller.signal;
          this.abortControllerMap.set(identifier, controller);
        }

        return res;
      },
      (err: any) => err,
    );

    // 使用实例拦截器
    this.instance.interceptors.request.use(
      this.interceptorsObj?.requestInterceptors as any,
      this.interceptorsObj?.requestInterceptorsCatch,
    );

    this.instance.interceptors.response.use(
      ((response: AxiosResponse) => {
        if (this.interceptorsObj?.responseInterceptors) {
          // 调用 responseInterceptors，传入 response 和 this
          return this.interceptorsObj.responseInterceptors(response, this);
        }
        // 如果没有提供 responseInterceptors，直接返回 response.data
        return response;
      }) as any,
      (error: any) => {
        // 错误拦截器逻辑
        if (this.interceptorsObj?.responseInterceptorsCatch) {
          return this.interceptorsObj.responseInterceptorsCatch(error, this);
        }
        return Promise.reject(error);
      },
    );
    // 全局响应拦截器保证最后执行
    this.instance.interceptors.response.use(
      (res: AxiosResponse) => {
        // 在响应中 移除完成的请求
        if (
          typeof res?.config?.data === "string" &&
          res?.config?.data?.indexOf("_cancelPendingRequest") > -1
        ) {
          const identifier = getAxiosRequestIdentifier(res.config);
          if (!identifier) return res;
          this.abortControllerMap.delete(identifier);
        }

        return res;
      },
      (err: any) => Promise.reject(err),
    );
  }

  private async axiosRequest<D, T>(config: RequestConfig<T>): Promise<T> {
    if (!this.instance) {
      throw new Error("Request axios instance is not available.");
    }

    let nextConfig = config;
    // 如果我们为单个请求设置拦截器，这里使用单个请求的拦截器
    if (nextConfig.interceptors?.requestInterceptors) {
      nextConfig = (await nextConfig.interceptors.requestInterceptors(
        nextConfig as any,
      )) as RequestConfig<T>;
    }

    const { option, ...rest } = nextConfig;
    let res: any = await this.instance.request<D, T>(
      rest as AxiosRequestConfig<D>,
    );

    if (axiosErrorMap.has(res?.code)) {
      // 内部错误校验
      return Promise.reject(`请求失败：${axiosErrorMap.get(res.code)}`);
    }

    // 如果我们为单个响应设置拦截器，这里使用单个响应的拦截器
    if (nextConfig.interceptors?.responseInterceptors) {
      res = await nextConfig.interceptors.responseInterceptors(res, this);
    }

    return (option?.header ? res : res.data) as T;
  }

  private async fetchRequest<D, T>(config: RequestConfig<T>): Promise<T> {
    const option = config.option;
    let resolvedConfig = this.resolveFetchConfig(
      config as unknown as RequestConfig<D>,
    );

    try {
      if (config.interceptors?.requestInterceptors) {
        resolvedConfig = this.resolveFetchConfig(
          (await config.interceptors.requestInterceptors(resolvedConfig)) as
            | RequestConfig<D>
            | ResolvedRequestConfig<D>,
        );
      }
      if (this.interceptorsObj?.requestInterceptors) {
        resolvedConfig = this.resolveFetchConfig(
          (await this.interceptorsObj.requestInterceptors(resolvedConfig)) as
            | RequestConfig<D>
            | ResolvedRequestConfig<D>,
        );
      }

      const response = await this.sendFetch(resolvedConfig);
      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new ApiError(
          getErrorMessage(data, `HTTP ${response.status}`),
          response.status,
          {
            code: getErrorCode(data),
            config: resolvedConfig,
            data,
            response,
          },
        );
      }

      let result: RequestResponse<T> = {
        config: resolvedConfig,
        data: data as T,
        headers: response.headers,
        response,
        status: response.status,
      };

      if (this.interceptorsObj?.responseInterceptors) {
        result = (await this.interceptorsObj.responseInterceptors(
          result,
          this,
        )) as RequestResponse<T>;
      }
      if (config.interceptors?.responseInterceptors) {
        result = (await config.interceptors.responseInterceptors(
          result,
          this,
        )) as RequestResponse<T>;
      }

      return (option?.header ? result : result.data) as T;
    } catch (error) {
      const apiError = toApiError(error, resolvedConfig);
      const handled = await this.handleFetchError(apiError, config);
      return (option?.header ? handled : getHandledData(handled)) as T;
    } finally {
      this.abortControllerMap.delete(getFetchRequestIdentifier(resolvedConfig));
    }
  }

  private async handleFetchError(
    error: ApiError,
    config: RequestConfig<any>,
  ): Promise<unknown> {
    if (config.interceptors?.responseInterceptorsCatch) {
      return config.interceptors.responseInterceptorsCatch(error, this);
    }
    if (this.interceptorsObj?.responseInterceptorsCatch) {
      return this.interceptorsObj.responseInterceptorsCatch(error, this);
    }
    throw error;
  }

  private resolveFetchConfig<TBody>(
    config: RequestConfig<TBody> | ResolvedRequestConfig<TBody>,
  ): ResolvedRequestConfig<TBody> {
    const method = normalizeMethod(config.method);
    const headers = {
      ...normalizeHeaders(this.defaultHeaders),
      ...normalizeHeaders(config.headers),
    };
    const requestURL = buildURL(
      config.baseURL ?? this.baseURL,
      config.url,
      config.params ?? config.query,
    );

    return {
      ...config,
      headers,
      method,
      requestURL,
    };
  }

  private async sendFetch<TBody>(
    config: ResolvedRequestConfig<TBody>,
  ): Promise<Response> {
    if (typeof globalThis.fetch !== "function") {
      throw new ApiError("Current runtime does not support fetch.", 0, {
        code: "FETCH_UNAVAILABLE",
        config,
      });
    }

    const controller = new AbortController();
    const abort = () => controller.abort();
    const timeout = setTimeout(abort, config.timeout ?? this.timeout);
    const identifier = getFetchRequestIdentifier(config);

    if (
      hasCancelPendingFlag(config.data) ||
      hasCancelPendingFlag(config.params) ||
      hasCancelPendingFlag(config.query)
    ) {
      this.abortControllerMap.get(identifier)?.abort();
      this.abortControllerMap.delete(identifier);
    }

    if (config.signal?.aborted) {
      abort();
    } else {
      config.signal?.addEventListener?.("abort", abort, { once: true });
    }

    this.abortControllerMap.set(identifier, controller);

    try {
      const body = buildRequestBody(config);
      return await globalThis.fetch(config.requestURL, {
        body,
        credentials:
          (config.withCredentials ?? this.withCredentials)
            ? "include"
            : "same-origin",
        headers: config.headers,
        method: config.method,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
      config.signal?.removeEventListener?.("abort", abort);
    }
  }
}

function resolveRequestAdapter(
  adapter: RequestAdapter = "auto",
): Exclude<RequestAdapter, "auto"> {
  if (adapter !== "auto") {
    return adapter;
  }

  return isReactNativeRuntime() ? "fetch" : "axios";
}

function isReactNativeRuntime(): boolean {
  const runtime = globalThis as typeof globalThis & {
    HermesInternal?: unknown;
    nativeCallSyncHook?: unknown;
    navigator?: Navigator & { product?: string };
  };

  return (
    runtime.navigator?.product === "ReactNative" ||
    !!runtime.HermesInternal ||
    !!runtime.nativeCallSyncHook
  );
}

function getGlobalMessage(): ((options: MessageOptions) => void) | undefined {
  return (
    globalThis as typeof globalThis & {
      $message?: (options: MessageOptions) => void;
    }
  ).$message;
}

function normalizeMethod(method?: RequestConfig["method"]): HttpMethod {
  return (method ?? "GET").toUpperCase() as HttpMethod;
}

function normalizeBaseURL(baseURL = ""): string {
  return baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;
}

function buildURL(
  baseURL: string | undefined,
  url: string,
  params?: QueryParams,
): string {
  const absoluteURL = /^https?:\/\//i.test(url);
  const base = absoluteURL ? "" : normalizeBaseURL(baseURL);
  const path = absoluteURL || url.startsWith("/") ? url : `/${url}`;
  const requestURL = `${base ?? ""}${path}`;
  const search = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, String(item)));
      return;
    }
    search.append(key, String(value));
  });

  const queryString = search.toString();
  if (!queryString) {
    return requestURL;
  }

  return `${requestURL}${requestURL.includes("?") ? "&" : "?"}${queryString}`;
}

function normalizeHeaders(
  headers?:
    | AxiosRequestConfig["headers"]
    | HeadersInit
    | Record<string, string>,
): Record<string, string> {
  const next: Record<string, string> = {};
  if (!headers) return next;

  new Headers(headers as HeadersInit).forEach((value, key) => {
    next[key] = value;
  });

  return next;
}

function buildRequestBody<TBody>(
  config: ResolvedRequestConfig<TBody>,
): BodyInit | undefined {
  if (
    config.data === undefined ||
    config.data === null ||
    config.method === "GET"
  ) {
    return undefined;
  }

  if (isBodyInit(config.data)) {
    return config.data;
  }

  const contentTypeKey = Object.keys(config.headers).find(
    (key) => key.toLowerCase() === "content-type",
  );
  if (!contentTypeKey) {
    config.headers["content-type"] = "application/json";
  }

  return JSON.stringify(config.data);
}

function isBodyInit(data: unknown): data is BodyInit {
  if (typeof data === "string") return true;
  if (typeof FormData !== "undefined" && data instanceof FormData) return true;
  if (typeof URLSearchParams !== "undefined" && data instanceof URLSearchParams)
    return true;
  if (typeof Blob !== "undefined" && data instanceof Blob) return true;
  if (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer)
    return true;
  return ArrayBuffer.isView(data);
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => undefined);
  }

  const text = await response.text().catch(() => "");
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === "object" && data !== null) {
    const message =
      "message" in data ? data.message : "msg" in data ? data.msg : undefined;
    if (typeof message === "string" && message) {
      return message;
    }
  }
  return fallback;
}

function getErrorCode(data: unknown): ApiErrorCode | undefined {
  if (typeof data === "object" && data !== null && "code" in data) {
    const code = data.code;
    if (typeof code === "string" || typeof code === "number") {
      return code;
    }
  }
  return undefined;
}

function toApiError(
  error: unknown,
  config: ResolvedRequestConfig<any>,
): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  const message = error instanceof Error ? error.message : "Network error";
  const code =
    error instanceof Error && error.name === "AbortError"
      ? "ABORTED"
      : "NETWORK_ERROR";
  return new ApiError(message, 0, {
    code,
    config,
    data: {
      originalError: error,
      url: config.requestURL,
    },
  });
}

function getHandledData(handled: unknown): unknown {
  if (typeof handled === "object" && handled !== null && "data" in handled) {
    return handled.data;
  }
  return handled;
}

function getFetchRequestIdentifier(
  config: Pick<ResolvedRequestConfig, "method" | "requestURL">,
): string {
  return `${config.method}-${config.requestURL}`;
}

function hasCancelPendingFlag(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  return Boolean((value as Record<string, unknown>)._cancelPendingRequest);
}

export { type RequestConfig, type RequestInterceptors };
