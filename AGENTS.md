<!--
模板：拷贝到每个业务 repo 根目录为 AGENTS.md。
替换 ojo-plugin 等占位符。这是给 Codex / Agent 看的"开工须知"。
-->

# AGENTS.md — ojo-plugin

本仓库属于 **cli**，DRI 见 team-os `maps/ownership.yml`。

## 开工前必读（顺序固定）
1. `team-os/context/active-risks.md` — 当前活跃风险
2. `team-os/context/active-cross-repo-changes.md` — 进行中的跨仓库改动
3. `team-os/agent-inbox/jacob953.md` — 你的收件箱
4. `team-os/context/repos/ojo-plugin.md` — 本仓库长期上下文
5. 本 repo 自身的 docs（若有 `docs/L1-OVERVIEW.md` 先读它）
6. 涉及契约时读 `team-os/maps/dependency-map.yml`，确认改动的影响面

## 工作规则
- 没有 issue，不开工；没有 linked issue，不合 PR。
- 改 **产品行为 / 架构 / API / DB schema / 权限 / 计费 / agent 行为** 必须有 decision。
- 收到影响提醒（inbox / PR comment）必须 ack。
- PR 必须说明 intent 与 risk（用 PR 模板）。

## Context Record
Codex/Agent 在完成工作前，必须判断是否需要把上下文回写到 `team-os`：
- 有明确交付进展 → 产出 `kind: progress`。
- 发现卡点、bug、阻塞或回归风险 → 产出 `kind: problem` 或 `kind: risk`。
- 产生产品/架构/API/DB/权限/计费/agent 行为决策 → 产出 `kind: decision`。
- 有值得周报/表扬的贡献 → 产出 `kind: highlight`。
- 有接手人需要知道的未完成上下文 → 产出 `kind: handoff`。

先 preview，再决定是否 apply：
```bash
node team-os/scripts/context-record.mjs preview record.json
node team-os/scripts/context-record.mjs apply record.json
```

约束：
- 不写密钥、token、secret、私钥。
- 不把原始群聊噪音直接写入长期 context。
- `title` 和 `summary` 用业务语言，不用 PR 名 / commit hash 代替结论。
- `evidence` 必须保留可回溯来源。
- 低置信度内容只作为候选，不当事实写入。

## Decision logging
任务中若产生产品/架构/数据模型/API/权限/计费/agent 行为决策，**完成工作前**必须沉淀：
```
team-os/docs/decisions/NNNN-short-title.md
```
并在 `team-os/context/current-decisions.md` 登记指针。不要把决策只留在对话里。

## 本 repo 高风险文件 / 影响面
<!-- 参照 dependency-map.yml hotspots，列出改动后需触发影响面分析的路径，例如： -->
- `api/**` 契约变更 → 通知下游（见 dependency-map.yml）
- DB schema / 共享表 → 双向兼容评审
