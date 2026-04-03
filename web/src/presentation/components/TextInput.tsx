import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/presentation/lib/cn';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  headerRight?: ReactNode;
  className?: string;
};

export function TextInput({ label, icon, trailing, headerRight, id, className, ...rest }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <label className="block text-sm font-semibold text-on-surface-variant" htmlFor={id}>
          {label}
        </label>
        {headerRight}
      </div>
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={cn(
            'block w-full py-4 bg-surface-container-high border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-tertiary/20 transition-all duration-200 outline-none',
            icon ? 'pl-11' : 'pl-4',
            trailing ? 'pr-12' : 'pr-4',
            className,
          )}
          {...rest}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">{trailing}</div>
        )}
      </div>
    </div>
  );
}
