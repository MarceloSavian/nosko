import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/presentation/lib/cn';

const trackVariants = cva('w-full rounded-full bg-surface-container-high', {
  variants: {
    size: {
      sm: 'h-1',
      md: 'h-1.5',
      lg: 'h-2',
      xl: 'h-3',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const fillVariants = cva('h-full rounded-full transition-all', {
  variants: {
    color: {
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      gradient: 'bg-gradient-to-r from-secondary to-primary',
    },
  },
  defaultVariants: {
    color: 'primary',
  },
});

type Props = VariantProps<typeof trackVariants> &
  VariantProps<typeof fillVariants> & {
    value: number;
    max?: number;
    className?: string;
    trackClassName?: string;
  };

export function ProgressBar({ value, max = 100, size, color, className, trackClassName }: Props) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn(trackVariants({ size }), trackClassName, className)}>
      <div className={cn(fillVariants({ color }))} style={{ width: `${percentage}%` }} />
    </div>
  );
}
