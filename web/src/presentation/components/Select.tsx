import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from '@/presentation/lib/cn';

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> & {
  label: string;
  icon?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
};

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, icon, error, children, id, className, ...rest }, ref) => {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center ml-1">
          <label
            className="block text-[10px] font-semibold text-primary/60 tracking-widest uppercase"
            htmlFor={id}
          >
            {label}
          </label>
        </div>
        <div className="relative group">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            id={id}
            className={cn(
              'block w-full py-4 pr-4 bg-surface-container-highest border-none rounded-2xl text-on-surface focus:ring-2 focus:ring-tertiary/20 transition-all duration-200 outline-none appearance-none cursor-pointer font-medium',
              icon ? 'pl-11' : 'pl-4',
              error && 'ring-2 ring-error/40',
              className,
            )}
            {...rest}
          >
            {children}
          </select>
        </div>
        {error && <p className="text-error text-xs px-1">{error}</p>}
      </div>
    );
  },
);
