import { Database, Eraser, FilePlus2 } from 'lucide-react';
import './WorkspaceActions.css';

interface WorkspaceActionsProps {
  onCreateBlank: () => void;
  onClear: () => void;
  onManageLocalData?: () => void;
  createDisabled?: boolean;
  clearDisabled?: boolean;
}

export function WorkspaceActions({
  onCreateBlank,
  onClear,
  onManageLocalData,
  createDisabled = false,
  clearDisabled = false,
}: WorkspaceActionsProps) {
  return (
    <div className="workspace-actions-group">
      <div className="workspace-actions" role="group" aria-label="工作区操作">
        <button
          type="button"
          className="workspace-action"
          onClick={onCreateBlank}
          disabled={createDisabled}
          title={createDisabled ? '当前已是空白星图' : undefined}
        >
          <FilePlus2 size={13} strokeWidth={1.9} aria-hidden="true" />
          新建空白星图
        </button>
        <button
          type="button"
          className="workspace-action workspace-action--danger"
          onClick={onClear}
          disabled={clearDisabled}
          title={clearDisabled ? '当前已是空白星图' : undefined}
        >
          <Eraser size={13} strokeWidth={1.9} aria-hidden="true" />
          清空星图
        </button>
      </div>
      <div className="workspace-actions__foot">
        <p className="workspace-actions__hint">
          {createDisabled
            ? '空白星图不会自动回退示例，可从导入或示例开始'
            : '清空后 10 秒内可撤销，最近一次清空会保留在本机'}
        </p>
        {onManageLocalData && (
          <button
            type="button"
            className="workspace-actions__manage"
            onClick={onManageLocalData}
          >
            <Database size={10} strokeWidth={2} aria-hidden="true" />
            本机数据
          </button>
        )}
      </div>
    </div>
  );
}
