<!--
模板：拷贝到每个业务 repo 根目录为 AGENTS.md。
替换 ojo-plugin 等占位符。这是给 Codex / Agent 看的"开工须知"。
-->

# AGENTS.md — ojo-plugin

本仓库属于 **cli**，DRI 见 team-os `maps/ownership.yml`。

## 统一入口
先读 `team-os/skills/team-os-onboarding/SKILL.md`。这里是本仓库的短版开工须知；完整流程以 team-os skill 为准。

## 开工前必读（顺序固定）
1. `team-os/context/active-risks.md` — 当前活跃风险
2. `team-os/context/active-cross-repo-changes.md` — 进行中的跨仓库改动
3. `team-os/context/current-decisions.md` — 当前生效决策
4. `team-os/context/runtime-repo-mapping.md` — 真实运行面与有效 repo
5. `team-os/agent-inbox/jacob953.md` — 你的收件箱
6. `team-os/context/repos/ojo-plugin.md` — 本仓库长期上下文
7. 本 repo 自身的 docs（若有 `docs/L1-OVERVIEW.md` 先读它）
8. 涉及契约时读 `team-os/maps/dependency-map.yml`、`ownership.yml`、`people.yml`

## 默认工作流
Issue -> Project -> Context -> PR -> Review -> Release -> Ship Log / Context Record。

不要从代码 diff 直接开始。没有 issue 先建 issue；merged PR 只算已合入，只有 release 到 prod 才算正式上线。

## 工作规则
- 没有 issue，不开工；没有 linked issue，不合 PR。
- Issue 标题必须用中文说明需求 / 问题。
- PR 标题可以保留 `[codex]`、`feat:`、`fix:`、`docs:` 等标志，但标题主体必须用中文说明交付内容。
- PR 必须用 `Fixes #123`、`Closes #123` 或 `Resolves #123` 关联 issue；这样 GitHub 才会自动填 issue 行的 `Linked pull requests`。
- Product Engineering OS 以 issue 为主行；PR 是 issue 下的交付证据，不要为每个 PR 单独建 Project 行。
- 改 **产品行为 / 架构 / API / DB schema / 权限 / 计费 / agent 行为** 必须有 decision。
- 收到影响提醒（inbox / PR comment）必须 ack。
- PR 必须说明 intent、risk、测试证据、decision/context 链接（用 PR 模板）。
- 在飞书项目群先用 `/link-github <github_handle>` 绑定账号；否则 Context Bot 只能显示 GitHub handle，不能真正 @ 人。
- 如果卡片要求 `需要 XXX 确认`，XXX 应是被影响/必须知道的人（DRI、下游 owner、风险 owner、release owner），不是默认 PR 作者。

## Review / Decision / Context Sync
- Review 先看正确性和回归风险，再看缺 decision/context、跨 repo 影响、测试和 rollout。
- Review 时先确认 linked issue 是中文标题，PR body 使用 `Fixes` / `Closes` / `Resolves`，PR 标题主体也是中文。
- 需要 decision 的变更先写 `team-os/docs/decisions/NNNN-short-title.md`，再登记 `team-os/context/current-decisions.md`。
- 飞书讨论沉淀用 Context Sync preview，先看候选内容，再决定是否 apply 或建 issue。
- 不要把未确认群聊、密钥、token、私钥、原始聊天噪音写进长期 context。

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

线上预览入口：
```bash
curl "https://bot.horsleyma.site/internal/context/ai/preview?q=当前有什么风险"
curl "https://bot.horsleyma.site/internal/context/sync/preview?chat_id=<chat_id>&hours=24"
curl "https://bot.horsleyma.site/internal/digest/preview"
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

## Release / Ship Log
交付状态改变时，用 `kind: progress` 写 Ship Log。老板卡只看业务语言：交付了什么、影响什么、状态是什么、是否需要拍板。不要把 PR 名称当作老板层结论。

## Handoff
工作未完成、被阻塞、或需要别人接手时，写 `kind: handoff`，说明当前状态、repo/branch/issue/PR、已验证事项、未知点、下一步 owner。

## 本 repo 高风险文件 / 影响面
<!-- 参照 dependency-map.yml hotspots，列出改动后需触发影响面分析的路径，例如： -->
- `api/**` 契约变更 → 通知下游（见 dependency-map.yml）
- DB schema / 共享表 → 双向兼容评审
