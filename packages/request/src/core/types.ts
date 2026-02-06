import type { UseFetchReturnType } from './interface';

// 增强 useFetch 返回类型的工具类型
export type TypedUseFetchReturn<T> = Omit<UseFetchReturnType<any, T>, 'data'> & {
  data?: T;
};

// 用于服务层 hook 的类型定义
export type ServiceHook<T> = (
  params?: any,
  options?: any
) => TypedUseFetchReturn<T>;
