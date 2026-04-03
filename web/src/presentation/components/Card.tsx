import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/presentation/lib/cn';

const cardVariants = cva('rounded-3xl', {
  variants: {
    variant: {
      default: 'bg-surface-container-lowest shadow-sm',
      elevated: 'bg-surface-container-lowest shadow-[0_20px_50px_-12px_rgba(25,28,29,0.06)]',
      outlined: 'bg-surface-container-lowest border border-outline-variant/20',
      hero: 'bg-gradient-to-br from-primary to-primary-container text-white',
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
