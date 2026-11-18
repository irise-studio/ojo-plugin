<p align="right">
  <strong>简体中文</strong> | <a href="README.en.md">English</a>
</p>

# OJO：按 agent 安装

OJO 帮助 agent 检查和转换本地网站、同步 workspace、构建 prototype、生成状态快照，以及执行用户授权的发布和远程对话。按使用的 agent 选择安装方式：

| 使用环境 | 安装内容 | 安装方式 |
| --- | --- | --- |
| Codex | OJO CLI + OJO Codex 插件 | Codex marketplace |
| Claude Code | OJO CLI + 4 个独立 skills | Claude Code skills 目录 |
| 其他支持 Agent Skills 的 agent | OJO CLI + 4 个独立 skills | 共享或指定的 skills 目录 |

安装器直接从 GitHub 运行，无需单独发布 npm 安装器包。当前源码可先运行 `npm ci`，再用 `node bin/ojo-plugin.mjs` 代替以下 `npx` 入口进行验证。

## Codex

```bash
npx -y github:irise-studio/ojo-plugin#main install --agent codex
```

安装器检查 Codex 支持的命令，准备 OJO CLI，注册或刷新 `irise-studio` marketplace，再安装并验证 `ojo@irise-studio`。需要官方 Codex CLI 和 Git；安装完成后新建一个 Codex 任务。

旧命令 `npx -y github:irise-studio/ojo-plugin#main install` 继续默认安装 Codex 插件。手动安装和完整说明见 [Codex 插件文档](codex-plugin/README.md#安装方法)。

## Claude Code

```bash
npx -y github:irise-studio/ojo-plugin#main install --agent claude-code
```

一次准备好 OJO CLI 和全部 skills，默认安装到 `~/.claude/skills/`；设置了 `CLAUDE_CONFIG_DIR` 时使用该目录下的 `skills/`。安装器不要求 Codex，也不注册 Claude Code 插件。

只在当前项目使用时，指定项目 skills 目录：

```bash
npx -y github:irise-studio/ojo-plugin#main install --agent claude-code --skills-dir ./.claude/skills
```

安装后开启新的 Claude Code 会话，可使用 `/convert-to-ojo` 或直接描述需要完成的 OJO 工作。目录规则见 [Claude Code 官方 skills 文档](https://code.claude.com/docs/en/skills)。

## 其他 agent

```bash
npx -y github:irise-studio/ojo-plugin#main install --agent other
```

默认将独立 skills 安装到 `~/.agents/skills/`。如果 agent 使用其他目录，显式指定：

```bash
npx -y github:irise-studio/ojo-plugin#main install --agent other --skills-dir ./my-agent/skills
```

请选用支持 `SKILL.md` 并读取相应目录的 agent。[Agent Skills 文档](https://agentskills.io/client-implementation/adding-skills-support)介绍了共享目录约定；具体加载规则由宿主决定。安装器验证文件安装和 CLI，不代表每个 agent 已发现或调用这些 skills。

## CLI 与 skills

三种方式都保留通过检查的 OJO CLI，只有缺失时才执行 `npm install --global @touchine-ai/ojo@latest`。当前支持 `@touchine-ai/ojo` 2.x 和 server.v1 capabilities；已有 CLI 不兼容时会停止，`OJO_CLI_BIN` 可指定自定义可执行文件。

Claude Code 和其他 agent 安装相同的四个 skills，包含引用文档、快照脚本及 CLI 检查脚本；运行时不依赖 npx 缓存。

| Skill | 用途 |
| --- | --- |
| `convert-to-ojo` | 检查并转换非 OJO 本地网站或应用 |
| `build-irise-prototype` | 实现、修复、校验和构建 prototype |
| `generate-irise-snapshots` | 生成和校验页面状态快照 |
| `ojo-workspace` | 同步 workspace、执行授权发布和远程对话 |

## 环境与更新

- 需要 Node.js 20+、npm，以及访问 npm 的网络。Codex marketplace 和从 GitHub 运行安装器还需要 Git 和 GitHub 访问。
- 在任一安装命令后加 `--dry-run`，只检查并预览，不安装 CLI、不写入 skills 或 marketplace。`--help` 查看完整选项。
- 安装器不发起登录。远程操作需要有效账号和项目权限，需要时另行运行 `ojo auth login`。
- 重复运行相同命令会刷新插件或更新本安装器管理的 skills。独立 skills 发生同名冲突或存在本地改动时会停止；先保留改动、移走冲突目录或选择其他 `--skills-dir` 后重试。其他 skills 不受影响。
- 若 npm 全局安装目录不在 `PATH`，安装器会停止。用 `npm prefix -g` 检查，将 macOS/Linux 的 `<prefix>/bin` 或 Windows 的 `<prefix>` 加入 `PATH` 后重试。
- `OJO_CLI_BIN` 可选择自定义 CLI；无效时需先修复或取消。Windows 仅支持官方 npm shim、JavaScript 入口或原生可执行文件，不支持任意批处理包装脚本。

## 仓库与发布

本仓库维护安装器、Codex marketplace 和共用 skills，不包含 OJO CLI 实现。Codex 插件资源由 Git marketplace 分发；Claude Code 和其他 agent 的 skills 随 GitHub 安装器一起分发。

```text
.agents/plugins/marketplace.json  # Codex marketplace
codex-plugin/                     # Codex 插件及共用 skills/辅助脚本
bin/ojo-plugin.mjs                # 安装器入口与参数
lib/install.mjs                   # CLI 检查及 agent 分流
lib/skills.mjs                    # 独立 skills 安装与冲突保护
```

维护者在 PR 中验证安装器和分发内容：

```bash
npm ci
npm test
npm pack --dry-run
```

合入 `main` 后，用户直接重新运行 GitHub 安装命令即可获取更新，无需发布独立 npm 安装器包。修改和 PR 不等于已合入；合入前可将 GitHub URL 中的 `#main` 换成待验证的分支或提交。安装器只有显式运行入口才执行安装。
