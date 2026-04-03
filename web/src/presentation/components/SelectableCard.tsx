import type { ReactNode } from 'react';
import { cn } from '@/presentation/lib/cn';

type Props = {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
};

export function SelectableCard({ selected, onSelect, children, className }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'rounded-2xl p-6 text-left transition-all cursor-pointer w-full',
        selected
          ? 'bg-secondary/5 border-2 border-secondary shadow-sm'
          : 'bg-surface-container-lowest border-2 border-transparent hover:border-outline-variant/30',
        className,
      )}
    >
      {children}
    </button>
  );
}
