# cyberutopian

前端脚手架

## 前置

1. node - v18+
2. pnpm - v8+

## 工具

1. @cyberutopian/builder：打包工具。node工具、组件库和前端工程都可以打包
2. @cyberutopian/generator - 生成项目工程的命令工具
3. @cyberutopian/patcher：脚手架。所有的工具的集中命令对象
4. @cyberutopian/logger：日志打印。工具的日志打印标准
5. @cyberutopian/request：前端请求工具
6. @cyberutopian/type-definer：接口出入参转为typescript声明的工具
7. @cyberutopian/ui-definer：设计规范转化工具

### 使用

#### 安装

```bash
npm install @cyberutopian/patcher -g
```

#### 生成模板项目

```bash
patcher gen
```

#### 接口类型生成

如果项目根目录没有`patcher.config.json`

```bash
patcher -i
```

生成如下

```json
{
  "types": {
    "url": [],
    "dir": "./src/services"
  },
  "ui": {
    "dir": "./src/specific"
  }
}
```

输入swagger的地址，执行命令便能生成类型声明

```bash
patcher typing -t
```

#### 设计规范

也需要`patcher.config.json`

生成UI规范

path为设计规范(design token)的文件路径

```bash
patcher ui -u [path]
```

