<p align="right">
  <strong>简体中文</strong> | <a href="README.en.md">English</a>
</p>

# OJO Plugin Marketplace

## 一条命令安装

本仓库提供 npm 安装器 `@touchine/ojo-plugin`。**首次 npm 发布尚未完成，以下 npm 命令在发布后可用：**

```bash
npx -y @touchine/ojo-plugin@latest install
```

首次发布前，本变更合入 `main` 后可直接从 GitHub 运行同一安装器：

```bash
npx -y github:irise-studio/ojo-plugin#main install
```

安装器会检查运行环境，保留兼容的 OJO CLI，缺失时安装已验证的 CLI，注册 marketplace、安装并验证插件。安装完成后新建一个 Codex 任务；远程操作需要时另行运行 `ojo auth login`。需要 Node.js 20+、npm、Git，以及支持 `codex plugin add` 的官方 Codex CLI（已验证 `0.163.0`）。还需能访问 npm 和 GitHub。

预览安装步骤可在命令后加 `--dry-run`；查看帮助可将 `install` 换为 `--help`。同名 marketplace 来源冲突、已有 CLI 不兼容或 npm 全局目录不在 `PATH` 时，安装器会停止并给出提示。完整要求与手动回退方式见 [插件安装文档](codex-plugin/README.md#安装方法)。

## 仓库用途

本仓库是 Irise Studio 面向 Codex 的 OJO 插件分发仓库，负责维护：

- Codex marketplace 清单；
- 可由普通用户安装的插件包；
- 插件所需的 skills、说明文档和本地辅助脚本。

本仓库不包含 OJO CLI 的实现，也不要求普通插件用户读取单独的 `irise-studio/irise-web` 仓库。
当前插件面向 `@touchine/ojo >=1.0.9 <2.0.0`；已验证版本可通过 `npm install -g @touchine/ojo@1.0.9` 安装。

## 已支持的插件

| 显示名称 | 插件 ID | 目录 | 状态 | 主要用途 |
| --- | --- | --- | --- | --- |
| OJO | `ojo` | [`codex-plugin/`](codex-plugin/) | 可安装 | 转换和优化本地网站、同步 OJO workspace、校验及构建 prototype、生成状态快照、按用户授权发布内容，以及执行远程 OJO 对话和查询 |

安装方法和完整功能说明请参阅 [`codex-plugin/README.md`](codex-plugin/README.md)。

## 仓库结构

```text
.agents/plugins/marketplace.json  # Codex marketplace 入口
codex-plugin/                     # OJO Codex 插件包
bin/ojo-plugin.mjs                # npx 安装器入口
lib/install.mjs                   # 安装与验证流程
```

## 维护者发布

安装器使用独立 npm 版本，插件资源仍由 Git marketplace 分发。首次发布需要具有 `@touchine` scope 发布权限的维护者完成；合入 PR 不等于 npm 已发布。

```bash
npm ci
npm test
npm pack --dry-run
npm publish --access public
```

发布前检查 npm 包名、版本和打包内容；发布后在干净环境运行上方 npm 命令验收，再移除“首次 npm 发布尚未完成”的说明。安装器没有 npm lifecycle 安装副作用，只有显式运行入口才执行安装步骤。
