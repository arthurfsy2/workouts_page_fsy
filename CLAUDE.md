# Workouts Page - Claude Code 速查

## 技术栈
- Vite + React 18
- Tailwind CSS v4
- TypeScript
- 字体：Plus Jakarta Sans + Noto Sans SC

## Git
- Commit 格式：**`[type] description`**（feat/fix/docs/test/refactor/chore），**必须方括号，禁止 conventional commits 的圆括号格式**（如 `feat(scope):` ❌）
- 默认不自动 push，等用户说「commit+push」或「提交」
- Commit 按语义边界拆分（不按文件数）：每个 commit 独立可用，一个逻辑单元不切到两个 commit

## 常用命令
- 开发：`pnpm dev`
- 构建：`pnpm build`
- 代码检查：`pnpm lint`

## 设计规范
- 品牌色：`#006CB8`（沉稳蓝）
- 圆角：`rounded-xl = 1.25rem`
- 阴影：`shadow-warm`（蓝色调暖投影）
- 字体：Plus Jakarta Sans（英文）+ Noto Sans SC（中文）

## 代码规范
- 使用 CSS 变量（`text-primary`、`bg-muted`），不用硬编码色值
- 图标使用 `lucide-react`
- className 用 Tailwind 类名
