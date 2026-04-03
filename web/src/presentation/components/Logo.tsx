import { cva, type VariantProps } from 'class-variance-authority';
import { Icon } from '@/presentation/components/Icon';
import { cn } from '@/presentation/lib/cn';

const logoVariants = cva('flex items-center', {
  variants: {
    size: {
      sm: 'space-x-2',
      md: 'space-x-2',
      lg: 'space-x-3',
    },
    tone: {
      dark: '',
      light: '',
    },
  },
  defaultVariants: {
    size: 'md',
    tone: 'dark',
  },
});

const iconSizeMap = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-10 h-10',
} as const;

const textSizeMap = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-2xl',
} as const;

type Props = VariantProps<typeof logoVariants> & {
  className?: string;
};

export function Logo({ size = 'md', tone = 'dark', className }: Props) {
  const resolvedSize = size ?? 'md';

  return (
    <div className={cn(logoVariants({ size, tone }), className)}>
      <div
        className={cn(
          'bg-secondary rounded-full flex items-center justify-center',
          iconSizeMap[resolvedSize],
        )}
      >
        <Icon name="payments" filled className="text-white text-xl" />
      </div>
      <span
        className={cn(
          'font-extrabold tracking-tighter font-headline',
          textSizeMap[resolvedSize],
          tone === 'light' ? 'text-white' : 'text-primary',
        )}
      >
        Nosko
      </span>
    </div>
  );
}
