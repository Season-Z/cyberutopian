import { requestInstance } from '..';
import type { FetchRequestConfig, FetchResponse } from './interface';

/**
 * @description: 函数的描述
 * @generic D 请求参数
 * @generic T 响应结构
 * @param {FetchRequestConfig} config 不管是GET还是POST请求都使用data
 * @returns {Promise}
 */
const syFetch = <D = any, T = any>(config: FetchRequestConfig<D, T>) => {
  return requestInstance?.request<D, FetchResponse<T>>(config) as Promise<FetchResponse<T>>;
};

export default syFetch;
