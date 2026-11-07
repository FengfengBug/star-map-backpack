import { CircleCheck } from 'lucide-react';
import './Toast.css';

interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps) {
  return (
    <div className="toast" role="status" aria-live="polite">
      <CircleCheck size={15} strokeWidth={2} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
