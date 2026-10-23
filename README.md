<p align="right">
  <strong>简体中文</strong> | <a href="README.en.md">English</a>
</p>

# OJO Plugin Marketplace

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
```
