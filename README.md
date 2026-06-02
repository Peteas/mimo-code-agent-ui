# MiMo Code Agent UI

基于 Vue 3 的 AI 编程助手聊天界面，与 MiMo Code Agent 后端配合使用，提供实时流式对话、代码高亮、会话管理等功能。

## 功能特性

- **SSE 流式对话** - 通过 Server-Sent Events 实现实时流式响应，支持思考过程、工具调用、结果展示等事件类型
- **会话管理** - 创建、切换、删除对话会话，会话列表持久化存储在后端
- **JWT 认证** - 登录/注册弹窗，自动 Token 刷新，基于 Axios 拦截器实现无感续期
- **深色/浅色主题** - 一键切换，偏好保存到 localStorage
- **Markdown 渲染** - AI 回复支持完整 Markdown 语法，代码块带语法高亮和一键复制
- **工具调用可视化** - 展示 AI 调用工具的过程和结果，区分系统消息与工具消息
- **响应式布局** - 侧边栏在移动端自动折叠，支持汉堡菜单切换
- **流式控制** - 对话生成时可取消，支持重新生成回复，自动滚动到底部

## 技术栈

| 层级 | 技术 | 版本 |
|---|---|---|
| 框架 | Vue 3 (Composition API) | ^3.5.34 |
| 语言 | TypeScript | ~6.0.2 |
| 构建工具 | Vite | ^8.0.12 |
| 路由 | Vue Router | ^4.6.4 |
| 状态管理 | Pinia | ^3.0.4 |
| CSS 框架 | Tailwind CSS v4 | ^4.3.0 |
| HTTP 客户端 | Axios + 原生 fetch (SSE) | ^1.16.1 |
| Markdown 渲染 | markdown-it | ^14.2.0 |
| 代码高亮 | highlight.js | ^11.11.1 |

## 项目结构

```
src/
├── api/                    # API 接口层
│   ├── auth.ts             # 认证接口（登录、注册、刷新 Token）
│   ├── chat.ts             # 聊天接口（SSE 流式请求）
│   ├── client.ts           # Axios 实例（JWT 拦截器、自动刷新）
│   └── session.ts          # 会话接口（列表、删除、消息）
├── components/
│   ├── auth/
│   │   └── AuthModal.vue   # 登录/注册弹窗
│   ├── chat/
│   │   ├── ChatInput.vue   # 消息输入框
│   │   └── ChatMessage.vue # 消息气泡组件
│   └── layout/
│       ├── Header.vue      # 顶部导航栏
│       └── Sidebar.vue     # 侧边栏（会话列表）
├── router/
│   └── index.ts            # 路由配置
├── stores/                 # Pinia 状态管理
│   ├── auth.ts             # 认证状态
│   ├── chat.ts             # 聊天状态（会话、消息、流式传输）
│   └── theme.ts            # 主题状态
├── utils/
│   └── markdown.ts         # Markdown 渲染工具（含代码高亮和复制按钮）
├── views/
│   └── ChatView.vue        # 主聊天页面
├── App.vue                 # 根组件
├── main.ts                 # 应用入口
└── style.css               # 全局样式 + Tailwind 配置
```

## 快速开始

### 环境要求

- Node.js >= 18
- 后端服务运行在 `http://localhost:8080`

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`，API 请求自动代理到 `http://localhost:8080`。

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 可用脚本

| 脚本 | 命令 | 说明 |
|---|---|---|
| `dev` | `vite` | 启动开发服务器 |
| `build` | `vue-tsc -b && vite build` | 类型检查 + 生产构建 |
| `preview` | `vite preview` | 预览生产构建 |

## API 接口

### 认证 (`/api/auth`)

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/refresh` | 刷新 Token |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 聊天 (`/api/chat`)

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/chat` | 发送消息（SSE 流式响应） |

### 会话 (`/api/sessions`)

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/sessions` | 获取会话列表 |
| DELETE | `/api/sessions/:id` | 删除会话 |
| GET | `/api/sessions/:id/messages` | 获取会话消息历史 |

## SSE 事件协议

聊天接口通过 SSE 返回流式数据，每条事件为 JSON 格式：

```json
{
  "type": "EVENT_TYPE",
  "toolName": "工具名称",
  "content": "内容",
  "isError": false
}
```

| 事件类型 | 说明 |
|---|---|
| `THINKING` | AI 思考过程 |
| `TOOL_CALL` | 工具调用请求 |
| `TOOL_RESULT` | 工具执行结果 |
| `ANSWER_CHUNK` | 回答内容片段 |
| `DONE` | 流式传输完成 |
| `ERROR` | 发生错误 |

## 架构说明

### 状态管理 (Pinia)

- **useChatStore** - 管理会话列表、当前会话、消息列表、SSE 流式传输状态
- **useAuthStore** - 管理 JWT Token、用户信息、登录状态
- **useThemeStore** - 管理深色/浅色主题切换

### API 层

- **client.ts** - 创建 Axios 实例，自动附加 Bearer Token，401 响应时自动刷新 Token 并重试
- **chat.ts** - 使用原生 `fetch` + `ReadableStream` 处理 SSE 流式响应，逐行解析事件数据

## 后端要求

本项目为纯前端应用，需要配合后端服务使用。后端需实现以下功能：

- RESTful API 接口（认证、会话管理）
- SSE 流式聊天响应
- JWT 认证与 Token 刷新机制

默认后端地址：`http://localhost:8080`（通过 Vite 开发服务器代理）

## License

MIT
