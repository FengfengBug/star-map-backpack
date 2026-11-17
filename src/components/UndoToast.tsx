import { Eraser, Undo2 } from 'lucide-react';
import './UndoToast.css';

interface UndoToastProps {
  message?: string;
  detail?: string;
  inline?: boolean;
  onUndo: () => void;
}

export function UndoToast({
  message = '已清空当前星图',
  detail = '12 个知识点已移到本机备份',
  inline = false,
  onUndo,
}: UndoToastProps) {
  return (
    <div
      className={`undo-toast ${inline ? 'undo-toast--inline' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="undo-toast__icon" aria-hidden="true">
        <Eraser size={15} strokeWidth={1.9} />
      </span>
      <span className="undo-toast__copy">
        <strong>{message}</strong>
        <span>{detail}</span>
      </span>
      <button type="button" className="undo-toast__action" onClick={onUndo}>
        <Undo2 size={13} strokeWidth={2} aria-hidden="true" />
        撤销
      </button>
      {!inline && (
        <span className="undo-toast__timer" aria-hidden="true">
          <i />
        </span>
      )}
    </div>
  );
}
