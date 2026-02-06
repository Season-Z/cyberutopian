import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import axios, { type AxiosResponse } from 'axios';
import { axiosErrorMap } from '../utils/config';
import { getRequestIdentifier } from '../utils/constants';
import type { CreateRequestConfig, MessageOptions, RequestConfig, RequestInterceptors, ResponseHandlers } from './interface';

export class Request {
  // axios 实例
  instance: AxiosInstance;
  // 拦截器对象
  interceptorsObj?: RequestInterceptors<AxiosResponse>;
  // * 存放取消请求控制器Map
  abortControllerMap: Map<string, AbortController>;
  // * 提示函数
  message: (options: MessageOptions) => void;
  // * handlers
  handlers?: ResponseHandlers<any>;

  constructor(config: CreateRequestConfig) {
    this.instance = axios.create(config);
    // * 初始化存放取消请求控制器Map
    this.abortControllerMap = new Map();
    this.interceptorsObj = config.interceptors;
    this.message = config.message || (window as any).$message;
    this.handlers = config.handlers || {};
    // 拦截器执行顺序 接口请求 -> 实例请求 -> 全局请求 -> 实例响应 -> 全局响应 -> 接口响应
    this.instance.interceptors.request.use(
      (res: InternalAxiosRequestConfig) => {
        if (res?.data?.['_cancelPendingRequest'] || res?.params?.['_cancelPendingRequest']) {
          const identifier = getRequestIdentifier(res);
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
    this.instance.interceptors.request.use(this.interceptorsObj?.requestInterceptors, this.interceptorsObj?.requestInterceptorsCatch);

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        if (this.interceptorsObj?.responseInterceptors) {
          // 调用 responseInterceptors，传入 response 和 this
          return this.interceptorsObj.responseInterceptors(response, this);
        }
        // 如果没有提供 responseInterceptors，直接返回 response.data
        return response;
      },
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
        if (typeof res?.config?.data === 'string' && res?.config?.data?.indexOf('_cancelPendingRequest') > -1) {
          const identifier = getRequestIdentifier(res.config);
          if (!identifier) return res;
          this.abortControllerMap.delete(identifier);
        }

        return res;
      },
      (err: any) => {
        return Promise.reject(err);
      },
    );
  }
  request<D, T>(config: RequestConfig<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      // 如果我们为单个请求设置拦截器，这里使用单个请求的拦截器
      if (config.interceptors?.requestInterceptors) {
        config = config.interceptors.requestInterceptors(config as any);
      }

      const { option, ...rest } = config;
      this.instance
        .request<D, T>(rest)
        .then(async (res: any) => {
          if (axiosErrorMap.has(res?.code)) {
            // 内部错误校验
            return reject(`请求失败：${axiosErrorMap.get(res.code)}`);
          }

          // 如果我们为单个响应设置拦截器，这里使用单个响应的拦截器
          if (config.interceptors?.responseInterceptors) {
            res = await config.interceptors.responseInterceptors(res, this);
          }

          const response = option?.header ? res : res.data;
          resolve(response);
        })
        .catch((err: any) => {
          reject(err);
        });
    });
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
      this.abortControllerMap.get(_url)?.abort();
      this.abortControllerMap.delete(_url);
    }
  }
}

export { type RequestConfig, type RequestInterceptors };
