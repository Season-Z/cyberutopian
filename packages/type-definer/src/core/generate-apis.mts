import { ApiAST, TypeAST } from '@/types';
import { getJsdoc } from '@/utils/jsdoc';
import { DEPRECATED_WARM_MESSAGE } from '../template/tmp';

/** 备注 */
function getDocComment(data: ApiAST) {
  const tag = data.tags?.reduce((pre, next) => `${pre} ${next}`, '');
  return getJsdoc({
    description: `${tag} / ${data.summary}`,
    deprecated: data.deprecated ? DEPRECATED_WARM_MESSAGE : undefined,
  });
}

function getParamsDataType(data: ApiAST) {
  return data.queryParamsTypeName;
}

function getPostDataType(data: ApiAST) {
  return data.requestBodyTypeName || 'undefined';
}

function getResponseType(data: ApiAST) {
  return data.responseTypeName || 'any';
}

function getFetchRequestType(data: ApiAST) {
  const p = getParamsDataType(data);
  const d = getPostDataType(data);

  if (p && d) {
    return `${p} | ${d}`;
  }
  if (p) {
    return p;
  }
  if (d) {
    return d;
  }
  return 'undefined';
}

function getApiFnCode(code: string, fnName: 'createFetch' | 'createHookFetch') {
  return `export function ${fnName}() {
    return {
     ${code}
    }
  }`;
}

function generateApis(apis: ApiAST[], types: TypeAST[], fnName: 'createFetch' | 'createHookFetch') {
  try {
    const requestFnName = fnName === 'createFetch' ? 'fetch' : 'useFetch';
    const options = fnName === 'createFetch' ? '' : 'options?: FetchOptions';
    const ops = fnName === 'createFetch' ? '' : 'options';

    const apisCode = apis.reduce((prev, next) => {
      const { serviceName, queryParamsTypeName, endPoint, additionalAxiosConfig, method } = next;

      return (
        prev +
        `${getDocComment(next)} ${serviceName}: ({
          url,
          params,
          data,
          configOverride,
          option
        }: {
          /** @param 覆写请求地址 */
          url?: string;
          /** @param query 请求参数 */
          params?: ${getParamsDataType(next) || 'undefined'};
          /** @param body 请求参数 */
          data?: ${getPostDataType(next)};
          /** @param configOverride 请求配置 */
          configOverride?: AxiosRequestConfig;
          /** @param option 请求选项 */
          option?: {
            /** @param header 本次请求是否拿到完整的response */
            header?: boolean;
          };
        },  ${options}) => {
          return request.${requestFnName}<${getFetchRequestType(next)}, ${getResponseType(next)}>({
            ...(overrideConfig(${additionalAxiosConfig}, configOverride) || {}),
            url: configOverride?.url || url || '${endPoint}',
            params: ${queryParamsTypeName ? 'params' : 'undefined'},
            data: data,
            method: '${method}',
            option,
          }, ${ops})
        },`
      );
    }, '');

    return getApiFnCode(apisCode, fnName);
  } catch (error) {
    console.error(error);
    return '';
  }
}

export { generateApis };
