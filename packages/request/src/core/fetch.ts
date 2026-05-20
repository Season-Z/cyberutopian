import { requestInstance } from "..";
import type { FetchRequestConfig, FetchResponse } from "./interface";

/**
 * @description: 函数的描述
 * @generic D 请求参数
 * @generic T 响应结构
 * @param {FetchRequestConfig} config 不管是GET还是POST请求都使用data
 * @returns {Promise}
 */
const syFetch = <D = any, T = any>(config: FetchRequestConfig<D, T>) => {
  if (!requestInstance) {
    return Promise.reject(
      new Error(
        "Request instance is not configured. Call setup(request) first.",
      ),
    );
  }

  return requestInstance.request<D, FetchResponse<T>>(config);
};

export default syFetch;
