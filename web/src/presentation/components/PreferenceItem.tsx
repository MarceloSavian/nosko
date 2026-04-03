import type { ReactNode } from 'react';
import { Icon } from '@/presentation/components/Icon';
import { IconBox } from '@/presentation/components/IconBox';

type Props = {
  icon: string;
  title: ReactNode;
  subtitle: ReactNode;
  onClick?: () => void;
};

export function PreferenceItem({ icon, title, subtitle, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center space-x-4 p-4 w-full rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer text-left"
    >
      <IconBox icon={icon} size="md" shape="circle" tone="surface" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-on-surface">{title}</p>
        <p className="text-xs text-on-surface-variant">{subtitle}</p>
      </div>
      <Icon name="chevron_right" className="text-xl text-outline" />
    </button>
  );
}
