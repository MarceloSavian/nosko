import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '@/presentation/lib/cn';

const badgeVariants = cva('inline-flex items-center font-bold', {
  variants: {
    variant: {
      success: 'bg-secondary/10 text-secondary',
      info: 'bg-primary/10 text-primary',
      neutral: 'bg-surface-container-high text-on-surface-variant',
      error: 'bg-error/10 text-error',
      outline: 'border border-secondary text-secondary',
      purple: 'bg-tertiary/10 text-tertiary',
      light: 'bg-white/10 text-white',
    },
    size: {
      sm: 'px-2 py-0.5 text-[10px] rounded-full tracking-wider uppercase',
      md: 'px-3 py-1 text-xs rounded-full',
      lg: 'px-4 py-1.5 text-xs rounded-xl',
    },
  },
  defaultVariants: {
    variant: 'neutral',
    size: 'md',
  },
});

type Props = VariantProps<typeof badgeVariants> & {
  children: ReactNode;
  className?: string;
};

export function Badge({ variant, size, className, children }: Props) {
  return <span className={cn(badgeVariants({ variant, size }), className)}>{children}</span>;
}
