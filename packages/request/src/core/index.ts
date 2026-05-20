import { Request, type RequestInterceptors } from "./request";

type RequestInstanceType<T> =
  | (Request & Partial<RequestInterceptors<T>>)
  | null;

export let requestInstance: RequestInstanceType<any> = null;
export const setup = <T>(instance: RequestInstanceType<T>) => {
  requestInstance = instance;
};

export { default as fetch } from "./fetch";

export * from "./interface";
export { default as useFetch } from "./useFetch";

export { ApiError, isApiError, Request } from "./request";
export * from "./types";
