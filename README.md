# 星图背包

把课程笔记转化为可交互的知识星图，通过 0-1 背包算法，在有限复习时间内筛选最值得复习的知识点，并生成可视化复习航线。

当前仓库已完成 **第一阶段：项目初始化与核心界面**、**Sprint 2：Markdown/TXT 笔记导入与示例课程**、**Sprint 3 的节点编辑面板与参数控件（Task 3.1、Task 3.2）**，以及 **Sprint 4 的 0-1 背包纯函数与可解释输出（Task 4.1–Task 4.3）**。项目不包含账号、后端、云数据库或 AI；背包算法尚未接入界面。

## 当前已实现

- 可运行的 React + TypeScript + Vite 项目
- 基于 `@xyflow/react` 的可交互知识星图
- 内置两套示例课程：数据结构与算法（12 个知识点）与计算机组成原理（14 个知识点）
- 示例课程选择器，载入前确认并替换当前星图
- 自定义星体节点与星座边
- 节点拖动、画布缩放与平移
- 节点大小与亮度编码
- 点击节点或目录查看详情
- 节点位置写入 LocalStorage，刷新后恢复
- 点击“编辑”修改标题、摘要、分值占比、预计用时与掌握度，保存后星体尺寸/亮度、目录与详情同步更新
- 分值占比、预计用时与掌握度使用滑块 + 数字输入联动控件，留空保持“待设置”，越界与小数即时提示
- 编辑数值时当前星体尺寸/亮度实时预览，取消或切换节点自动还原，其余节点不跟随重渲染
- 示例课程编辑按课程分别写入 LocalStorage，刷新或切换课程后保留；导入笔记的编辑仅本次会话有效
- 载入示例课程、重新载入当前课程、恢复初始布局
- 粘贴或上传 Markdown/TXT 笔记，解析预览后确认替换星图
- 空内容、非法格式、超限文件与解析失败均有明确提示
- 示例数据统一标注“示例数据，参数可编辑”
- 纯 TypeScript 0-1 背包算法：按分钟预算选择复习节点，收益 = 分值占比 ×（100 − 掌握度），输出选中/放弃与总收益、总用时
- 每个选中/放弃节点都有结构化理由（code + 参数）与可复现文案，覆盖选中、超预算、待设置、非法参数、掌握度已满与未入选
- 桌面与移动端响应式布局

尚未实现、且界面上已明确标注为后续阶段的功能：0-1 背包算法的界面联动与复习航线、学习记录、AI 能力。导入的知识点分值占比、掌握度与预计用时保持“待设置”，可在右侧详情面板点击“编辑”补充；导入结果仅保存在本次会话，刷新后恢复默认示例课程。

## 技术栈

- React 19 + TypeScript + Vite
- `@xyflow/react`（React Flow）
- Lucide React
- 原生 CSS / CSS Variables
- LocalStorage
- Vitest（单元测试）

## 本地运行

要求 Node.js `^20.19.0` 或 `>=22.12.0`（Vite 8 的运行要求）。

```bash
npm install
npm run dev
```

开发服务器默认运行在 `http://localhost:5173/`。

```bash
npm run build      # TypeScript 类型检查 + 生产构建
npm run preview    # 预览生产构建
npm run typecheck  # 仅执行类型检查
npm test           # 运行 Vitest 单元测试
```

## 目录结构

```text
star-map-backpack/
├─ public/
│  └─ favicon.svg
├─ src/
│  ├─ components/
│  │  ├─ Header.tsx            顶部品牌、课程与剩余复习时间
│  │  ├─ Sidebar.tsx           笔记来源、载入示例、知识点目录
│  │  ├─ KnowledgeGraph.tsx    React Flow 画布与图例
│  │  ├─ StarNode.tsx          自定义星体节点
│  │  ├─ ConstellationEdge.tsx 自定义星座关联边
│  │  ├─ DetailPanel.tsx       选中知识点详情与编辑面板
│  │  ├─ inputs/
│  │  │  └─ RangeNumberField.tsx/.css 滑块与数字联动输入控件
│  │  ├─ ReviewRoute.tsx       底部复习航线占位区
│  │  ├─ NoteImportPreview.tsx 笔记导入弹窗、预览与确认流程
│  │  ├─ SampleCoursePicker.tsx 示例课程选择、课程信息与确认载入
│  │  ├─ StarBackdrop.tsx      确定性星空背景
│  │  ├─ StarGlyph.tsx         复用星形 SVG
│  │  └─ Toast.tsx             轻量操作反馈
│  ├─ data/
│  │  ├─ sampleCourse.ts       数据结构与算法示例课程、章节与知识点
│  │  ├─ computerOrganizationCourse.ts 计算机组成原理示例课程、章节与知识点
│  │  ├─ sampleCourses.ts      示例课程注册表与查询
│  │  └─ sampleCourses.test.ts 示例课程完整性测试
│  ├─ algorithms/
│  │  ├─ knapsack.ts           0-1 背包纯函数：预算、收益、取舍与理由生成
│  │  ├─ knapsack.test.ts      算法边界、最优性、理由与纯函数测试
│  │  └─ knapsack.sample.test.ts 两套示例课程集成测试与暴力枚举校验
│  ├─ parsers/
│  │  ├─ noteParser.ts         Markdown/TXT 解析器核心函数
│  │  ├─ noteParser.test.ts    解析器单元测试
│  │  ├─ toKnowledgeNodes.ts   解析草稿到节点与关联边映射
│  │  ├─ toKnowledgeNodes.test.ts 映射单元测试
│  │  ├─ importedNote.ts       导入适配：校验、章节生成与课程摘要
│  │  └─ importedNote.test.ts  导入适配单元测试
│  ├─ styles/
│  │  └─ base.css              设计令牌、基础样式
│  ├─ types/
│  │  ├─ knowledge.ts          知识点与图节点类型
│  │  ├─ noteSource.ts         笔记来源摘要类型
│  │  └─ parsedNote.ts         解析草稿类型
│  ├─ utils/
│  │  ├─ knowledgeGraph.ts     数据转 React Flow 节点与边
│  │  ├─ star.ts               星体尺寸、亮度、格式化工具
│  │  ├─ storage.ts            LocalStorage 坐标与节点编辑持久化
│  │  └─ storage.test.ts       存储兼容性与损坏数据测试
│  ├─ App.tsx                  工作区状态与交互编排
│  ├─ App.css                  页面布局与响应式规则
│  └─ main.tsx                 应用入口
├─ index.html
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

## 主要组件

| 组件 | 职责 |
| --- | --- |
| `App.tsx` | 持有节点、选中状态、位置与节点编辑持久化逻辑，编排四个工作区区域。 |
| `Header` | 展示产品名、当前课程、剩余复习时间与本地存储提示。 |
| `Sidebar` | 展示当前笔记来源、示例课程/导入入口与按章节分组的知识点目录。 |
| `SampleCoursePicker` | 展示两套示例课程的知识点数、章节数、关系数与时间预算；确认后替换当前星图。 |
| `KnowledgeGraph` | 配置 React Flow、自定义节点/边、缩放控件与视觉图例。 |
| `StarNode` | 根据分值计算尺寸、根据掌握度计算亮度，渲染星体、标签与选中轨道。 |
| `ConstellationEdge` | 父子关系使用实线，关联关系使用虚线；选中节点关联边高亮并出现中点光点。 |
| `DetailPanel` | 展示摘要、分值占比、预计用时、掌握度、上级与关联节点；支持跳转，并可编辑与保存节点字段。 |
| `RangeNumberField` | 滑块与数字输入双向联动；留空“待设置”，越界与小数即时提示，支持键盘与触控。 |
| `ReviewRoute` | 展示复习池、待复习时长与可用时间；生成按钮明确标记为算法阶段接入。 |
| `NoteImportPreview` | 粘贴或选择 Markdown/TXT 文件，解析预览、错误提示与确认替换；明确标注参数待设置。 |

## 数据模型

每个知识点包含：

```ts
{
  id, title, content,
  parentId, scoreShare, mastery,
  estimatedMinutes, reviewed, position
}
```

示例数据额外包含 `chapterId`、`tone`、`relatedIds`，用于章节归类、星体色调与关联边生成。

星体视觉编码：

- **尺寸**由 `scoreShare` 映射到 28–56px
- **亮度**由 `mastery` 映射，掌握度越高越明亮
- **颜色**按章节分为蓝、青、紫、金四组
- 已复习节点标签旁显示绿色小点

## 交互与持久化

- 拖动星体调整布局，拖动画布平移，滚轮或控件缩放。
- 点击星体、目录条目或详情中的关联节点，会同步高亮并更新详情。
- 每次拖动结束后，将全部节点坐标写入 LocalStorage。
- 坐标存储键：`star-map-backpack:node-positions:v1`。
- 详情面板点击“编辑”可修改标题、摘要、分值占比、预计用时与掌握度；标题/摘要必填，分值 1–100、用时 1–600、掌握度 0–100，非法输入被拦截，取消不写入。
- 分值/用时/掌握度支持滑块与数字联动；编辑数值时当前星体立即预览尺寸与亮度，取消编辑或切换节点后还原，保存后才写入。
- 示例课程的节点编辑按 `sample:<courseId>` 写入 `star-map-backpack:node-edits:v1`，刷新或切换课程后保留且互不串课；导入笔记的编辑仅本次会话有效。
- “载入示例课程”打开选择器，确认后替换当前课程、重置选中并清除已保存坐标。
- 侧栏刷新按钮重新载入当前示例课程；导入笔记后没有活动示例课程，刷新会恢复默认示例课程。
- “恢复布局”会保留当前选中节点，恢复当前课程坐标并清除已保存位置；节点编辑不受影响。
- 导入笔记先解析预览，确认后才替换当前星图，并清空选中与已保存坐标。
- 导入结果仅保存在本次会话；导入参数保持“待设置”，可在详情面板补充，刷新后恢复示例笔记。
- 存储读取包含结构校验与异常兜底，兼容旧坐标数据，损坏数据不会阻塞页面。

## 设计与实现说明

- 深蓝黑宇宙背景，星体仅使用蓝、青、紫与少量金色，避免高频随机动画。
- 组件样式与业务逻辑分离，节点/边转换和存储逻辑位于 `src/utils/`。
- 示例课程通过 `src/data/sampleCourses.ts` 注册表并存：保留数据结构与算法示例，新增计算机组成原理示例，互不覆盖。
- 解析与映射位于 `src/parsers/`：`parseNote` 负责结构解析，`toKnowledgeNodes` 生成节点并按同级相邻关系生成去重关联边；`importedNote` 负责字符/文件/节点数校验、章节生成与课程摘要；全流程不伪造分值、掌握度或时间。
- 导入 UI 仅接受 Markdown/TXT，单文件不超过 200 KB；确认前不写入星图，确认后替换当前星图。
- 当前阶段所有交互均基于真实状态；算法入口以禁用状态明确标注，不使用假数据伪装功能。
- 已适配 1440、1280 与 390 宽度，并支持 `prefers-reduced-motion`。

## 0-1 背包算法（Sprint 4 / Task 4.1）

- 入口：`planReviewRoute(items, budgetMinutes)`，纯函数，不依赖 React、DOM、LocalStorage 或系统时间。
- 容量：`budgetMinutes` 分钟预算，小数向下取整，负数视为 0。
- 重量：节点 `estimatedMinutes`，必须为正整数。
- 收益：`scoreShare × (100 − mastery)`；掌握度越高，剩余可提升空间越小。
- 参数处理：分值/用时/掌握度任一为“待设置”或非法（分值 ≤ 0、用时非正整数、掌握度超出 0–100）的节点不参与选择，计入 `skippedIds`。
- 取舍：收益并列时优先保留输入顺序靠前的节点，结果可复现。
- 输出：`selectedIds`、`skippedIds`、`totalBenefit`、`totalMinutes`，以及按输入顺序排列的 `decisions`。
- 理由：每个 decision 含 `reason.code`、`reason.params` 与可展示 `message`；`describeReason(reason)` 可由结构化参数复现文案。
- 理由代码：`selected-in-route`（选中）、`skipped-over-budget`（超出预算）、`skipped-no-mastery-gap`（掌握度已满）、`skipped-pending-parameters`（参数待设置）、`skipped-invalid-parameters`（参数非法）、`skipped-not-in-route`（未进入最优组合）。
- 待设置与非法参数理由会列出具体字段与当前值；未入选理由会引用自身收益与选中组合总收益。
- 测试：`npm test` 同时运行边界/理由单测与两套示例课程集成测试；集成测试覆盖预算 0、超预算、全选、复习池过滤、确定性与多档预算，并用暴力枚举校验最优总收益。
- 当前未接入界面。

## 后续路线

1. Sprint 2：Markdown/TXT 解析、知识点映射、笔记导入与计算机组成原理示例课程（已完成）
2. Sprint 3：节点编辑面板、分值与掌握度更新（Task 3.1、Task 3.2 已完成）
3. Sprint 4：`src/algorithms/` 独立 0-1 背包算法与测试（Task 4.1–Task 4.3 已完成）
4. Sprint 5：算法与星图联动、航线动画、时间滑块
5. Sprint 6：学习记录、状态更新、分享海报
6. Sprint 7：AI 接口、异常处理与最终 UI 打磨

