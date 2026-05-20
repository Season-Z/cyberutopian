import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ErrorLevelMap } from "../core/interface";

const clientId = Math.floor(Math.random() * 1000000000000000) + Date.now();

export { clientId };
//# sourceMappingURL=constants.mjs.map

const getStorage = (
  type: "localStorage" | "sessionStorage",
): Storage | undefined => {
  if (typeof globalThis === "undefined") {
    return undefined;
  }

  const root = globalThis as typeof globalThis & {
    localStorage?: Storage;
    sessionStorage?: Storage;
  };
  return root[type];
};

export const getTokenHead = () => {
  return getStorage("localStorage")?.getItem("tokenHeand") ?? null;
};

export function getAutoLogin() {
  const localStorage = getStorage("localStorage");
  return (
    localStorage?.getItem("autoLogin") === "true" ||
    (localStorage?.getItem("autoLogin") === null &&
      !!localStorage?.getItem("token"))
  ); // 不影响线上之前记住登录的情况
}

export const getToken = () => {
  return getAutoLogin()
    ? (getStorage("localStorage")?.getItem("token") ?? null)
    : (getStorage("sessionStorage")?.getItem("token") ?? null);
};

export function getRefreshToken() {
  return (
    (getAutoLogin()
      ? getStorage("localStorage")?.getItem("refreshToken")
      : getStorage("sessionStorage")?.getItem("refreshToken")) || ""
  );
}

export const getTenementCode = () => {
  return getStorage("localStorage")?.getItem("tenement-code") ?? null;
};

export const getSystemLanguage = () => {
  return getStorage("localStorage")?.getItem("systemLanguage") ?? null;
};

export function getErrorMessage(error: AxiosError): string {
  let message = "未知错误";

  if (error.message.includes("Network Error")) {
    message = "网络连接失败";
  } else if (error.message.includes("timeout of")) {
    message = "请求服务器数据超时";
  } else if (error.code === "ECONNABORTED") {
    message = "请求超时，请检查网络连接";
  }

  return message;
}

export const ERROR_LEVEL_MAP: ErrorLevelMap = {
  0: "error",
  1: "warning",
  2: "info",
};

export const ERR_CODE_DETAIL_MAP: ErrorLevelMap = {
  4001: "未知错误，请联系管理员。",
  4002: "命名空间不存在，请创建后使用！",
  4003: "存在不合规的图片，请检查！",
  4004: "人脸识别失败，请重试！",
  // 5000: (res) => {
  //   DialogBox.confirm(res.message, $t('hint'), {
  //     showClose: false,
  //     showCancelButton: false,
  //   });
  // },
  // 5001: (res) => {
  //   DialogBox.confirm(res.message, $t('hint'), {
  //     showClose: false,
  //     showCancelButton: false,
  //     beforeClose: (action, instance, done) => {
  //       DialogBox.card().then((cardNo) => {
  //         hasCardAuthorize({ workNumber: cardNo, resourceCode: 'DFS2024082100004' }).then(() => {
  //           done();
  //         });
  //       });
  //     },
  //   });
  // },
};

/**
 * 获取请求的唯一标识符
 * @param {Object} config - 请求配置对象
 * @returns {String} - 请求的唯一标识符
 */
export const getRequestIdentifier = (config: InternalAxiosRequestConfig) => {
  if (!config) return;
  // 在这里可以根据具体需求生成一个唯一标识符
  return `${config.method}-${config.url}`;
};
