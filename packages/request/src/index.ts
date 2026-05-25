import { Request, type RequestInterceptors } from './core/request';

type RequestInstanceType<T> =
  | (Request & Partial<RequestInterceptors<T>>)
  | null;

export let requestInstance: RequestInstanceType<any> = null;
export const setup = <T>(instance: RequestInstanceType<T>) => {
  requestInstance = instance;
};

export { default as fetch } from './core/fetch';

export * from './core/interface';
export { default as useFetch } from './core/useFetch';

export { ApiError, isApiError, Request } from './core/request';
export * from './core/types';
