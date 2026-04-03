import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/presentation/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-bold transition-all duration-300 cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-on-primary hover:bg-primary/95 shadow-sm rounded-2xl',
        dark: 'bg-primary text-white hover:opacity-90 rounded-full',
        secondary:
          'bg-secondary text-primary hover:opacity-90 shadow-lg shadow-secondary/20 rounded-full',
        ghost:
          'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant rounded-xl',
        link: 'text-secondary hover:text-on-secondary-container bg-transparent p-0',
      },
      size: {
        sm: 'px-4 py-2 text-xs',
        md: 'px-6 py-3 text-sm',
        lg: 'px-10 py-4 text-lg',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

type Props = VariantProps<typeof buttonVariants> &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
    children: ReactNode;
    className?: string;
  };

export { buttonVariants };

export function Button({ variant, size, fullWidth, className, children, ...rest }: Props) {
  return (
    <button className={cn(buttonVariants({ variant, size, fullWidth }), className)} {...rest}>
      {children}
    </button>
  );
}
