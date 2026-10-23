<p align="right">
  <strong>简体中文</strong> | <a href="README.en.md">English</a>
</p>

# OJO Codex Plugin

## 插件功能

OJO 插件帮助 Codex 将本地网站或应用接入 OJO 工作流。当前支持：

- 对非 OJO 项目执行只读兼容性预检；
- 基于真实 OJO export，在保留现有行为的前提下转换本地项目；
- 同步指定 OJO 项目的 prototype workspace，并校验 manifest；
- 使用 OJO export 自带脚本在本地校验、构建 prototype，并生成和检查状态快照；
- 仅在用户明确授权后，将已校验的内容发布到指定 OJO 项目；
- 为授权导入选择默认 Team，并通过 API 回读结果；
- 通过经过验证的 `ojo chat` 和 `ojo query` 获取优化方案，并在用户确认后执行远程请求。

插件包含以下 skills：

| Skill | 用途 |
| --- | --- |
| `convert-to-ojo` | 检查并转换非 OJO 本地网站或应用 |
| `build-irise-prototype` | 实现、修复、校验和构建本地 prototype |
| `generate-irise-snapshots` | 生成和校验页面状态快照 |
| `ojo-workspace` | 同步 workspace、执行已授权发布，以及运行远程 OJO 对话和查询 |

插件显示名称为 **OJO**。

## 安装要求

- 能够访问 `irise-studio/ojo-plugin` 仓库；
- Node.js 20 或更高版本；
- `@touchine/ojo` CLI `>=1.0.9 <2.0.0`：命令名为 `ojo` 且位于 `PATH`，或通过 `OJO_CLI_BIN` 指定；
- 对于同步、发布、远程对话和查询，需要有效的 OJO 登录状态及相应项目权限。

安装当前已验证的 CLI 版本：

```bash
npm install -g @touchine/ojo@1.0.9
```

然后运行插件自带检查脚本，确认版本和命令签名：

```bash
node codex-plugin/scripts/check-ojo-cli.mjs
```

本仓库只分发 Codex 插件，不分发 OJO CLI。该 CLI 支持 workspace 同步、project import、Team、chat/query、screen 和 conversion report；本地 prototype 校验与构建使用 export 自带脚本，而不是不存在的 `ojo prototype` 子命令。

## 安装方法

1. 在终端中添加本仓库的 marketplace：

   ```bash
   codex plugin marketplace add irise-studio/ojo-plugin --ref main
   ```

2. 启动 Codex，输入 `/plugins` 打开插件目录。
3. 选择 **Irise Studio** marketplace，打开 **OJO**，然后选择安装。
4. 安装完成后新建一个任务，使插件 skills 被加载。

可选：查看已配置的 marketplace：

```bash
codex plugin marketplace list
```

需要获取仓库中的新版本时，可刷新该 marketplace：

```bash
codex plugin marketplace upgrade irise-studio
```

## 使用示例

```text
使用 OJO 检查并转换当前本地网站，校验构建和状态快照；只有在我确认目标项目后才上传。
```

```text
下载项目 <projectId> 的 prototype workspace 并校验 manifest，不要启动本地画布。
```

```text
让 OJO 为项目 <projectId> 生成优化方案，展示真实回复并等待我确认后再执行。
```
