import { Check, Info } from 'lucide-react';
import './ImportModePicker.css';

export type ImportMode = 'replace' | 'append';

interface ImportModePickerProps {
  currentCount: number;
  importCount: number;
  mode: ImportMode;
  onChange: (mode: ImportMode) => void;
}

export function ImportModePicker({
  currentCount,
  importCount,
  mode,
  onChange,
}: ImportModePickerProps) {
  if (currentCount === 0) {
    return (
      <div className="import-mode import-mode--empty">
        <Info size={14} strokeWidth={2} aria-hidden="true" />
        <p>当前星图为空，本次导入会直接创建新的工作区，无需选择写入方式。</p>
      </div>
    );
  }

  return (
    <section className="import-mode" aria-labelledby="import-mode-heading">
      <div className="import-mode__head">
        <div>
          <span className="eyebrow">写入方式</span>
          <h4 id="import-mode-heading">这次导入如何进入星图？</h4>
        </div>
        <span className="import-mode__current">当前 {currentCount} 个知识点</span>
      </div>

      <div className="import-mode__options" role="radiogroup" aria-label="导入写入方式">
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'replace'}
          className={`import-mode-card ${mode === 'replace' ? 'is-selected' : ''}`}
          onClick={() => onChange('replace')}
        >
          <span className="import-mode-card__top">
            <span className="import-mode-card__radio" aria-hidden="true" />
            <span className="import-mode-card__title">替换当前星图</span>
            <span className="import-mode-card__badge">默认</span>
          </span>
          <span className="import-mode-card__description">
            移除当前 {currentCount} 个知识点，只保留本次导入的 {importCount} 个。
          </span>
          <span className="import-mode-card__state">
            {mode === 'replace' && <Check size={11} strokeWidth={2.4} aria-hidden="true" />}
            {mode === 'replace' ? '将替换现有工作区' : '选择替换'}
          </span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={mode === 'append'}
          className={`import-mode-card ${mode === 'append' ? 'is-selected' : ''}`}
          onClick={() => onChange('append')}
        >
          <span className="import-mode-card__top">
            <span className="import-mode-card__radio" aria-hidden="true" />
            <span className="import-mode-card__title">追加为新章节</span>
            <span className="import-mode-card__badge">保留现有内容</span>
          </span>
          <span className="import-mode-card__description">
            保留现有 {currentCount} 个知识点，把本次 {importCount} 个放入新章节。
          </span>
          <span className="import-mode-card__state">
            {mode === 'append' && <Check size={11} strokeWidth={2.4} aria-hidden="true" />}
            {mode === 'append' ? '将保留现有节点与参数' : '选择追加'}
          </span>
        </button>
      </div>

      <p className="import-mode__hint">
        追加会生成新的章节与稳定 ID，不覆盖现有节点、参数与坐标；两种方式都会在确认后写入。
      </p>
    </section>
  );
}
