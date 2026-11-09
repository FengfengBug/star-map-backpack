# 星图背包

把课程笔记转化为可交互的知识星图，通过 0-1 背包算法，在有限复习时间内筛选最值得复习的知识点，并生成可视化复习航线。

当前仓库已完成 **第一阶段：项目初始化与核心界面**，并已接入 Sprint 2 的 Markdown/TXT 笔记导入。项目不包含账号、后端、云数据库、AI 或背包算法。

## 当前已实现

- 可运行的 React + TypeScript + Vite 项目
- 基于 `@xyflow/react` 的可交互知识星图
- 12 个示例知识点、4 个章节、9 条关联边
- 自定义星体节点与星座边
- 节点拖动、画布缩放与平移
- 节点大小与亮度编码
- 点击节点或目录查看详情
- 节点位置写入 LocalStorage，刷新后恢复
- 载入示例笔记、恢复初始布局
- 粘贴或上传 Markdown/TXT 笔记，解析预览后确认替换星图
- 空内容、非法格式、超限文件与解析失败均有明确提示
- 桌面与移动端响应式布局

尚未实现、且界面上已明确标注为后续阶段的功能：节点编辑、0-1 背包航线规划、学习记录、AI 能力。导入的知识点分值占比、掌握度与预计用时保持“待设置”，待 Sprint 3 节点编辑补充；导入结果仅保存在本次会话，刷新后恢复示例笔记。

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
│  │  ├─ DetailPanel.tsx       选中知识点详情
│  │  ├─ ReviewRoute.tsx       底部复习航线占位区
│  │  ├─ NoteImportPreview.tsx 笔记导入弹窗、预览与确认流程
│  │  ├─ StarBackdrop.tsx      确定性星空背景
│  │  ├─ StarGlyph.tsx         复用星形 SVG
│  │  └─ Toast.tsx             轻量操作反馈
│  ├─ data/
│  │  └─ sampleCourse.ts       示例课程、章节与知识点
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
│  │  └─ storage.ts            LocalStorage 位置持久化
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
| `App.tsx` | 持有节点、选中状态与位置持久化逻辑，编排四个工作区区域。 |
| `Header` | 展示产品名、当前课程、剩余复习时间与本地存储提示。 |
| `Sidebar` | 展示示例笔记信息、载入入口与按章节分组的知识点目录。 |
| `KnowledgeGraph` | 配置 React Flow、自定义节点/边、缩放控件与视觉图例。 |
| `StarNode` | 根据分值计算尺寸、根据掌握度计算亮度，渲染星体、标签与选中轨道。 |
| `ConstellationEdge` | 父子关系使用实线，关联关系使用虚线；选中节点关联边高亮并出现中点光点。 |
| `DetailPanel` | 展示摘要、分值占比、预计用时、掌握度、上级与关联节点；支持跳转。 |
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
- 存储键：`star-map-backpack:node-positions:v1`。
- “载入示例笔记”会重置选中节点和全部坐标，并清除已保存位置。
- “恢复布局”会保留当前选中节点，恢复当前课程坐标并清除已保存位置。
- 导入笔记先解析预览，确认后才替换当前星图，并清空选中与已保存坐标。
- 导入结果仅保存在本次会话；导入参数保持“待设置”，刷新后恢复示例笔记。
- 存储读取包含结构校验与异常兜底，损坏数据不会阻塞页面。

## 设计与实现说明

- 深蓝黑宇宙背景，星体仅使用蓝、青、紫与少量金色，避免高频随机动画。
- 组件样式与业务逻辑分离，节点/边转换和存储逻辑位于 `src/utils/`。
- 解析与映射位于 `src/parsers/`：`parseNote` 负责结构解析，`toKnowledgeNodes` 生成节点并按同级相邻关系生成去重关联边；`importedNote` 负责字符/文件/节点数校验、章节生成与课程摘要；全流程不伪造分值、掌握度或时间。
- 导入 UI 仅接受 Markdown/TXT，单文件不超过 200 KB；确认前不写入星图，确认后替换当前星图。
- 当前阶段所有交互均基于真实状态；算法入口以禁用状态明确标注，不使用假数据伪装功能。
- 已适配 1440、1280 与 390 宽度，并支持 `prefers-reduced-motion`。

## 后续路线

1. Sprint 2：Markdown/TXT 解析、知识点映射与笔记导入（已完成）；计算机组成原理示例数据包（待办）
2. Sprint 3：节点编辑面板、分值与掌握度更新
3. Sprint 4：`src/algorithms/` 独立 0-1 背包算法与测试
4. Sprint 5：算法与星图联动、航线动画、时间滑块
5. Sprint 6：学习记录、状态更新、分享海报
6. Sprint 7：AI 接口、异常处理与最终 UI 打磨

