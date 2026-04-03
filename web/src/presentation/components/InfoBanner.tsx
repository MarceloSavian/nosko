import type { ReactNode } from 'react';
import { Icon } from '@/presentation/components/Icon';
import { cn } from '@/presentation/lib/cn';

type Props = {
  icon: string;
  iconFilled?: boolean;
  title: ReactNode;
  description: ReactNode;
  className?: string;
};

export function InfoBanner({ icon, iconFilled, title, description, className }: Props) {
  return (
    <div
      className={cn(
        'flex items-start space-x-3 bg-surface-container-low rounded-xl p-4',
        className,
      )}
    >
      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
        <Icon name={icon} filled={iconFilled} className="text-white text-sm" />
      </div>
      <div>
        <p className="text-sm font-bold text-on-surface">{title}</p>
        <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">{description}</p>
      </div>
    </div>
  );
}
