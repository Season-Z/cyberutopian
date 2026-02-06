import type { AxiosInstance } from 'axios';
import { Request, type RequestInterceptors } from './request';

type RequestInstanceType<T> = (AxiosInstance & Request & RequestInterceptors<T>) | null;

export let requestInstance: RequestInstanceType<any> = null;
export const setup = <T>(instance: RequestInstanceType<T>) => {
  requestInstance = instance;
};

export { default as fetch } from './fetch';

export * from './interface';
export { default as useFetch } from './useFetch';

export { Request } from './request';
export * from "./types";
