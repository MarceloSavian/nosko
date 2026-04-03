import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/presentation/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-bold transition-all duration-300 cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-secondary text-on-secondary hover:bg-on-secondary-container shadow-lg shadow-secondary/20 rounded-full',
        dark: 'bg-primary text-white hover:bg-primary-container rounded-full',
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
