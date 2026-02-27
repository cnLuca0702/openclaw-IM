# OpenClaw IM Client

一个简单易用的OpenClaw桌面IM客户端，支持多连接、多会话、文件传输和智能回复。

## 连接OpenClaw的方式

### 方式一：直接连接（推荐）

1. 点击左侧的 `+` 按钮添加连接
2. 填写以下信息：
   - **连接名称**：例如"生产环境"、"测试机器人"
   - **Bot Token**：你的OpenClaw Bot Token（如 `sk-26WZSYVARITHD73YKQBHVXUCHY`）
   - **WebSocket地址**：默认使用官方地址，如需自建请修改
3. 点击"直接连接"即可

### 方式二：一键连接脚本

在添加连接对话框中填写连接名称和Bot Token后，点击"显示一键连接脚本"，会生成类似以下的命令：

```bash
bash <(curl -fsSL http://192.168.1.100:9527/install.sh) --bot-token sk-26WZSYVARITHD73YKQBHVXUCHY --connection-name "生产环境"
```

将此命令复制到你的OpenClaw Linux服务器上执行即可建立连接。

## 功能特性

### 💬 多会话管理
- 同时管理多个OpenClaw连接
- 每个连接支持多个会话
- 实时消息接收和发送

### 📎 文件传输
- 支持所有文件类型上传
- 图片、文档、音视频、压缩包等
- 拖拽上传支持

### 🤖 智能回复
- **AI辅助**：基于上下文生成回复建议
- **模板回复**：预设常用回复模板

### 🎨 界面特性
- 跨平台支持（Windows、macOS、Linux）
- 浅色/深色主题
- 本地数据持久化

## 快速开始

### 安装依赖

```bash
cd openclaw-im
npm install
```

### 开发模式

```bash
npm run dev
```

### 打包应用

```bash
# Windows
npm run dist:win

# macOS
npm run dist:mac

# Linux
npm run dist:linux
```

## 使用说明

### 添加连接

1. 点击左侧 `+` 按钮
2. 填写连接信息：
   - 连接名称：用于识别此连接
   - Bot Token：从OpenClaw后台获取
   - WebSocket地址：默认即可
3. 点击"直接连接"

### 管理会话

连接成功后，会话列表会自动加载。点击会话即可开始聊天。

### 发送消息

- 在输入框输入消息内容
- 按 `Enter` 发送，`Shift+Enter` 换行
- 点击 📎 上传文件
- 点击 🤖 获取AI回复建议
- 点击 📝 使用模板回复

### 管理回复模板

1. 点击左侧 📝 图标
2. 点击"新建模板"
3. 填写模板信息：
   - 模板名称
   - 模板内容（支持变量如 `{{date}}`、`{{time}}`）
   - 分类和标签

## 技术栈

- **前端**: React 18 + TypeScript
- **桌面框架**: Electron
- **状态管理**: Zustand
- **构建工具**: Vite
- **通信**: WebSocket

## 项目结构

```
openclaw-im/
├── electron/              # Electron主进程
│   ├── main.ts           # 主进程入口
│   ├── preload.ts        # 预加载脚本
│   └── tsconfig.json
├── src/
│   ├── components/       # React组件
│   ├── services/         # 业务逻辑
│   │   ├── openClawService.ts    # OpenClaw连接服务
│   │   ├── fileService.ts        # 文件上传服务
│   │   └── replyService.ts       # 回复服务
│   ├── stores/           # 状态管理
│   ├── types/            # 类型定义
│   ├── styles/           # 样式
│   ├── App.tsx           # 主应用
│   └── main.tsx          # React入口
├── package.json
├── vite.config.ts
└── README.md
```

## WebSocket协议

### 客户端发送

```json
{
  "type": "auth",
  "token": "sk-xxxxxxxx"
}
```

```json
{
  "type": "message",
  "sessionId": "session-id",
  "content": "消息内容",
  "messageId": "msg-id"
}
```

### 服务器响应

```json
{
  "type": "auth_success"
}
```

```json
{
  "type": "message",
  "sessionId": "session-id",
  "content": "收到的消息",
  "sender": {
    "id": "user-id",
    "name": "用户名"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 注意事项

1. **Bot Token安全**：请妥善保管你的Bot Token，不要泄露
2. **网络要求**：需要稳定的网络连接以保持WebSocket长连接
3. **防火墙设置**：确保防火墙允许应用访问网络

## 开发计划

- [x] 基础UI界面
- [x] WebSocket连接
- [x] 多连接管理
- [x] 文件上传
- [x] 模板回复
- [x] AI辅助回复
- [ ] 消息加密
- [ ] 表情包支持
- [ ] 语音消息
- [ ] 截图功能
- [ ] 消息搜索
- [ ] 聊天记录导出

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！
