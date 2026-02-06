import { useCallback, useEffect, useRef, useState } from 'react';
import { requestInstance } from '..';
import { type FetchOptions, type FetchRequestConfig, type FetchResponse, type UseFetchReturnType } from './interface';

const useFetch = <T = any, R = any>(config: FetchRequestConfig<T, R>, options?: FetchOptions): UseFetchReturnType<T, R> => {
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState<R | undefined>(undefined);

  // 用于存储最新的 config
  const configRef = useRef(config);

  // 更新 configRef
  configRef.current = config;

  // 发送请求的函数
  const requestFn = useCallback(async (data?: T | null, newConfig?: FetchRequestConfig<T, R>): Promise<FetchResponse<R>> => {
    setLoading(true);
    try {
      // 合并新的请求配置和旧的配置
      const response = await requestInstance?.request<T, FetchResponse<R>>({
        ...configRef.current,
        data: data ?? configRef.current.data,
        ...newConfig,
      });

      setResponseData(response);
      return response!;
    } catch (err) {
      const errRes = { msg: err } as any;
      setResponseData(errRes); // 错误的情况下，将错误信息存入 data
      return errRes;
    } finally {
      setLoading(false);
    }
  }, []);

  // 发送请求
  const sendRequest = useCallback((data?: T | null, newConfig?: FetchRequestConfig<T, R>) => {
    return requestFn(data, newConfig);
  }, [requestFn]);

  // 取消单个请求
  const cancel = useCallback(() => {
    requestInstance?.cancelRequest(configRef.current.url);
  }, []);

  // 取消所有请求
  const cancelAll = useCallback(() => {
    requestInstance?.cancelAllRequest();
  }, []);

  // 监听 config 的变化，并触发请求（包括首次挂载）
  useEffect(() => {
    if (options?.manual) return;

    let cancelled = false;

    const run = () => {
      if (!cancelled) {
        requestFn();
      }
    };

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.url, config.method, JSON.stringify(config.data), options?.manual]);

  return {
    loading,
    data: responseData as R | undefined,
    sendRequest,
    cancel,
    cancelAll,
  };
};

export default useFetch;
