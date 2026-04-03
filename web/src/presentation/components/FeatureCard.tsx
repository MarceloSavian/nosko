import type { ReactNode } from 'react';
import { cn } from '@/presentation/lib/cn';

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
};

export function FeatureCard({ icon, title, description, className }: Props) {
  return (
    <div className={cn('p-6 rounded-2xl', className)}>
      <div className="mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-on-surface-variant">{description}</p>
    </div>
  );
}
