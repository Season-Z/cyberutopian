# @cyberutopian/patch-micro

面向子应用的框架无关 Micro Runtime。它负责宿主认证状态桥接、401 跳转单飞、安全回跳和通用生命周期编排，不直接依赖 React、Vue、qiankun、飞书或请求库。

## 安装

```bash
pnpm add @cyberutopian/patch-micro
```

## 创建认证 Runtime

宿主 token 的格式由消费工程决定。下面示例兼容 Maintenance 当前使用的 JSON token，但公共包本身不了解该结构。

```ts
import { createMicroAuthRuntime } from "@cyberutopian/patch-micro";

const authRuntime = createMicroAuthRuntime({
  parseAccessToken: (rawToken) => {
    try {
      const token = JSON.parse(rawToken) as { access_token?: unknown };
      return typeof token.access_token === "string" ? token.access_token : "";
    } catch {
      return "";
    }
  },
  getStandaloneAccessToken: () => getLocalAccessToken(),
  onStandaloneAuthExpired: (redirectPath) => {
    window.location.replace(createProjectLoginUrl(redirectPath));
  },
});
```

请求层只读取 access token，并在 401 时通知 runtime。默认 1.5 秒内只有第一次通知会触发登录跳转。

```ts
request.interceptors.request.use((config) => {
  const accessToken = authRuntime.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

request.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401) {
    authRuntime.notifyAuthExpired();
  }
  return Promise.reject(error);
});
```

## React + qiankun 生命周期

公共包只生成生命周期，不负责注册到具体微前端框架。

```tsx
import {
  createMicroLifecycle,
  resolveMicroAppMountElement,
  type MicroAppProps,
} from "@cyberutopian/patch-micro";
import { createRoot, type Root } from "react-dom/client";
import {
  qiankunWindow,
  renderWithQiankun,
} from "vite-plugin-qiankun/dist/helper";

let root: Root | undefined;

const lifecycle = createMicroLifecycle<MicroAppProps>({
  authRuntime,
  mount: (props) => {
    const element = resolveMicroAppMountElement(props, "#root");
    if (!element) {
      throw new Error("micro app mount element #root was not found");
    }

    root = createRoot(element);
    root.render(<App basename={props.basename ?? props.routerBase ?? "/"} />);
  },
  unmount: () => {
    root?.unmount();
    root = undefined;
  },
});

export const { bootstrap, mount, update, unmount } = lifecycle;
renderWithQiankun(lifecycle);

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  void mount({});
}
```

## 安全回跳

动态 callback 必须从当前 Origin 生成，不要写死开发域名或接受外部 redirect。

```ts
import {
  createBrowserCallbackUrl,
  createStandaloneShellLoginUrl,
} from "@cyberutopian/patch-micro";

const callbackUrl = createBrowserCallbackUrl({
  callbackPath: "/login/callback",
});

const shellLoginUrl = createStandaloneShellLoginUrl({
  shellOrigin: "https://portal.example.com",
  shellActiveRule: "/maintenance",
  currentPath: `${location.pathname}${location.search}${location.hash}`,
});
```

`createStandaloneShellLoginUrl` 会保留 query/hash，并拒绝完整外部 URL、`//host/path`、非法 shell Origin 和非法登录路径。

## 宿主 Props 契约

`MicroAppProps` 兼容现有扁平 qiankun props：

- `basename`、`routerBase`、`container`
- `shellName`、`shellTitle`
- `getAuthToken`、`onAuthExpired`
- `onGlobalStateChange`、`offGlobalStateChange`

`setAuthToken` 与 `clearAuthToken` 仅为迁移兼容保留并已标记为 deprecated。子应用不应修改宿主认证状态。
