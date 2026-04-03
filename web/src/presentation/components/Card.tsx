import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/presentation/lib/cn';

const cardVariants = cva('rounded-[2rem]', {
  variants: {
    variant: {
      default: 'bg-surface-container shadow-sm',
      elevated: 'bg-surface-container shadow-[0_20px_50px_-12px_rgba(8,58,79,0.06)]',
      outlined: 'bg-surface-container border border-outline-variant/20',
      hero: 'bg-surface-container shadow-sm relative overflow-hidden',
      dark: 'bg-primary text-white',
      glass: 'bg-white/10 backdrop-blur-xl',
    },
    padding: {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
  },
});

type Props = VariantProps<typeof cardVariants> &
  Omit<HTMLAttributes<HTMLDivElement>, 'className'> & {
    children: ReactNode;
    className?: string;
  };

export function Card({ variant, padding, className, children, ...rest }: Props) {
  return (
    <div className={cn(cardVariants({ variant, padding }), className)} {...rest}>
      {children}
    </div>
  );
}
