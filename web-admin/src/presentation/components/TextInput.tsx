import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/presentation/lib/cn';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  headerRight?: ReactNode;
  error?: string;
  className?: string;
};

export const TextInput = forwardRef<HTMLInputElement, Props>(
  ({ label, icon, trailing, headerRight, error, id, className, ...rest }, ref) => {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center ml-1">
          <label
            className="block text-[10px] font-semibold text-primary/60 tracking-widest uppercase"
            htmlFor={id}
          >
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
            ref={ref}
            id={id}
            className={cn(
              'block w-full py-4 bg-surface-container-highest border-none rounded-2xl text-on-surface placeholder:text-primary/30 focus:ring-2 focus:ring-tertiary/20 transition-all duration-200 outline-none font-medium',
              icon ? 'pl-11' : 'pl-4',
              trailing ? 'pr-12' : 'pr-4',
              error && 'ring-2 ring-error/40',
              className,
            )}
            {...rest}
          />
          {trailing && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">{trailing}</div>
          )}
        </div>
        {error && <p className="text-error text-xs px-1">{error}</p>}
      </div>
    );
  },
);
