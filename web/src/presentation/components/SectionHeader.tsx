import type { ReactNode } from 'react';

type Props = {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({ title, action, className }: Props) {
  return (
    <div className={`flex items-center justify-between mb-6 ${className ?? ''}`}>
      <h2 className="font-headline text-2xl font-bold text-on-surface">{title}</h2>
      {action}
    </div>
  );
}
