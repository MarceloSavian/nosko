import type { ReactNode } from 'react';

type Props = {
  overline?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ overline, title, subtitle, actions }: Props) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        {overline && (
          <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">
            {overline}
          </p>
        )}
        <h1 className="font-headline text-3xl font-bold text-on-surface tracking-tight">{title}</h1>
        {subtitle && <p className="text-on-surface-variant mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center space-x-3">{actions}</div>}
    </div>
  );
}
