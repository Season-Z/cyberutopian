export const axiosErrorMap = new Map([
  ['ERR_BAD_OPTION_VALUE', '在 axios 配置中提供了无效或不支持的值。'],
  ['ERR_BAD_OPTION', '在 axios 配置中提供了无效的选项。'],
  ['ECONNABORTED', '请求因超出 axios 配置中指定的超时时间而超时。'],
  ['ETIMEDOUT', '请求因超出 axios 默认的时间限制而超时。'],
  ['ERR_NETWORK', '网络相关问题。'],
  ['ERR_FR_TOO_MANY_REDIRECTS', '请求重定向次数过多；超过了 axios 配置中指定的最大重定向次数。'],
  ['ERR_DEPRECATED', '使用了 axios 中已弃用的功能或方法。'],
  ['ERR_BAD_RESPONSE', '响应无法正确解析或格式出乎意料。'],
  ['ERR_BAD_REQUEST', '请求的格式出乎意料或缺少必要的参数。'],
  ['ERR_CANCELED', '功能或方法被用户明确取消。'],
  ['ERR_NOT_SUPPORT', '当前 axios 环境中不支持该功能或方法。'],
  ['ERR_INVALID_URL', '为 axios 请求提供了无效的 URL。'],
]);
