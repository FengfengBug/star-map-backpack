import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Header } from './Header';

describe('Header budget display', () => {
  it('显示本轮时间预算并格式化分钟数', () => {
    const html = renderToStaticMarkup(
      <Header courseTitle="数据结构与算法" courseTag="示例" budgetMinutes={150} />,
    );

    expect(html).toContain('本轮时间预算');
    expect(html).toContain('2 小时 30 分');
    expect(html).not.toContain('剩余复习时间');
  });

  it('预算为 0 时仍清晰可读', () => {
    const html = renderToStaticMarkup(
      <Header courseTitle="空白星图" courseTag="空白" budgetMinutes={0} />,
    );

    expect(html).toContain('本轮时间预算');
    expect(html).toContain('0 分钟');
  });

  it('课程切换后同步更新课程标题与预算值', () => {
    const html = renderToStaticMarkup(
      <Header courseTitle="计算机组成原理" courseTag="导入" budgetMinutes={45} />,
    );

    expect(html).toContain('计算机组成原理');
    expect(html).toContain('导入');
    expect(html).toContain('45 分钟');
    expect(html).toContain('本轮时间预算');
  });
});
