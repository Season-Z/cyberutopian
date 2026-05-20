import type {
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
  InternalAxiosRequestConfig,
} from "axios";
import { type Request } from "./request"; // 确保导入 Request 类
export interface MessageOptions {
  message: string;
  type: "success" | "error" | "warning";
  duration: number;
}
export type RequestAdapter = "auto" | "axios" | "fetch";
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type QueryParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly (string | number | boolean)[];
export type QueryParams = Record<string, QueryParamValue>;
export type ApiErrorCode = string | number;

export interface ResolvedRequestConfig<TData = unknown>
  extends Omit<RequestConfig<TData>, "headers" | "method"> {
  headers: Record<string, string>;
  method: HttpMethod;
  requestURL: string;
}

export interface RequestResponse<TData = unknown> {
  config: ResolvedRequestConfig<any>;
  data: TData;
  headers: Headers;
  response: Response;
  status: number;
}

export interface RequestInterceptors<T = any> {
  // 请求拦截
  requestInterceptors?: (
    config: InternalAxiosRequestConfig | ResolvedRequestConfig<any>,
  ) => any;
  requestInterceptorsCatch?: (err: any) => any;
  // 响应拦截
  responseInterceptors?: (
    result: T | RequestResponse<any>,
    _this: Request,
  ) => any;
  responseInterceptorsCatch?: (err: any, _this: Request) => any;
}
// 自定义传入的参数
export interface CreateRequestConfig<T = AxiosResponse>
  extends CreateAxiosDefaults {
  requestAdapter?: RequestAdapter;
  interceptors?: RequestInterceptors<T>;
  message?: (options: MessageOptions) => void;
  handlers?: ResponseHandlers<any>;
}
export interface RequestConfig<T = AxiosResponse> extends AxiosRequestConfig {
  baseURL?: string;
  interceptors?: RequestInterceptors<T>;
  option?: {
    header?: boolean;
  };
  params?: QueryParams;
  query?: QueryParams;
  timeout?: number;
  url: string;
}
export interface CancelRequestSource {
  [index: string]: () => void;
}

export type FetchResponse<T> = T;

// 重写返回类型
export interface FetchRequestConfig<T, R>
  extends RequestConfig<FetchResponse<R>> {
  url: string;
  /** @param 请求入参 */
  data?: T;
}

export interface FetchOptions {
  /** @param 是否手动控制请求，而不是初始化就发送 */
  manual?: boolean;
}

/** useFetch out type */
export interface UseFetchReturnType<T = any, R = any> {
  loading: boolean;
  data?: R;
  sendRequest: (
    data?: T | null,
    newConfig?: FetchRequestConfig<T, R>,
  ) => Promise<FetchResponse<R>>;
  cancel: () => void;
  cancelAll: () => void;
}

export interface ErrorLevelMap {
  [key: number | string]: string; // 将数字索引映射到字符串
}

export interface ResponseHandlers<T> {
  expired?: (res: T) => void;
  refreshToken?: (res: T) => void;
}

export { type AxiosRequestConfig };
