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
- 自动安装还需要 npm、Git、可访问 npm/GitHub 的网络，以及支持 `codex plugin add` 的官方 Codex CLI（已验证 `0.163.0`）；
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

### 自动安装

执行以下命令：

```bash
npx -y @touchine/ojo-plugin@latest install
```

也可以直接从 GitHub 安装：

```bash
npx -y github:irise-studio/ojo-plugin#main install
```

安装器检查 Node/Codex、保留已通过版本与命令检查的 CLI；只有缺失时才执行 `npm install --global @touchine/ojo@1.0.9`。随后注册或刷新本仓库 marketplace，执行 `codex plugin add ojo@irise-studio`，并回读已安装、已启用状态。重复运行会刷新同一来源并重新验证。

命令后加 `--dry-run` 可以只检查并预览安装命令，不执行 npm 安装或 marketplace 写入。安装器不发起登录；完成后新建 Codex 任务，需要访问远程项目时运行 `ojo auth login`。

- 如果设置了 `OJO_CLI_BIN`，检查该可执行文件；无效时先修复或取消该变量，安装器不会覆盖它。
- 自动查找 CLI 时会忽略 npm 注入的缓存和 `node_modules/.bin` 目录。若有意使用项目内的 CLI，请通过 `OJO_CLI_BIN` 指定完整路径，并让后续 Codex 任务继承该变量。
- 如果已有 CLI 不兼容，先确认影响，再显式安装兼容版本；安装器不会静默降级。
- 如果 npm 报目录权限错误，先修复用户的 npm 全局安装目录权限，再重试。不要依赖仅在当前 `npx` 进程中存在的 CLI。
- 如果安装后找不到 `ojo`，用 `npm prefix -g` 确认目录：macOS/Linux 的 `<prefix>/bin` 或 Windows 的 `<prefix>` 需加入 `PATH`，然后重试。
- 如果已有名为 `irise-studio` 的 marketplace 指向其他来源，安装器会在修改前停止。用 `codex plugin marketplace list` 检查；确认原来源及其插件不再需要后，才手动移除该来源并重试。安装器不会自动替换它。
- Windows、macOS 和 Linux 使用相同安装入口。Windows CI 使用真实 Codex/OJO npm 版本验证完整首次安装、重复安装和独立检查脚本；macOS 也已完成隔离环境安装验收。
- Windows 下的 OJO npm `.cmd` shim 只用于定位 `@touchine/ojo` 包声明的 JavaScript 入口，检查器与安装器直接用 Node 执行入口，不解释批处理文本。自定义 `OJO_CLI_BIN` 可指定 JavaScript 文件或原生可执行文件；任意 `.cmd`/`.bat` 包装脚本不受支持。

### 手动安装

先按上文安装并检查 OJO CLI，然后：

1. 在终端中添加本仓库的 marketplace：

   ```bash
   codex plugin marketplace add irise-studio/ojo-plugin --ref main
   ```

2. 支持命令行安装的 Codex 可直接运行：

   ```bash
   codex plugin add ojo@irise-studio
   ```

   也可启动 Codex，输入 `/plugins`，选择 **Irise Studio** marketplace，打开 **OJO** 并安装。
3. 安装完成后新建一个任务，使插件 skills 被加载。

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
