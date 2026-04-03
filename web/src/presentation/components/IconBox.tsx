import { cva, type VariantProps } from 'class-variance-authority';
import { Icon } from '@/presentation/components/Icon';
import { cn } from '@/presentation/lib/cn';

const iconBoxVariants = cva('flex items-center justify-center shrink-0', {
  variants: {
    size: {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-14 h-14',
    },
    shape: {
      rounded: 'rounded-xl',
      circle: 'rounded-full',
    },
    tone: {
      surface: 'bg-surface-container-high',
      primary: 'bg-primary text-white',
      secondary: 'bg-secondary/10',
      tertiary: 'bg-tertiary/10',
      error: 'bg-error/10',
    },
  },
  defaultVariants: {
    size: 'md',
    shape: 'rounded',
    tone: 'surface',
  },
});

const iconSizeMap = {
  sm: 'text-sm',
  md: 'text-xl',
  lg: 'text-3xl',
};

type Props = VariantProps<typeof iconBoxVariants> & {
  icon: string;
  filled?: boolean;
  iconClassName?: string;
  className?: string;
};

export function IconBox({
  icon,
  filled,
  size = 'md',
  shape,
  tone,
  iconClassName,
  className,
}: Props) {
  const defaultIconColor =
    tone === 'primary'
      ? 'text-white'
      : tone === 'secondary'
        ? 'text-secondary'
        : tone === 'tertiary'
          ? 'text-tertiary'
          : tone === 'error'
            ? 'text-error'
            : 'text-on-surface-variant';

  return (
    <div className={cn(iconBoxVariants({ size, shape, tone }), className)}>
      <Icon
        name={icon}
        filled={filled}
        className={cn(iconSizeMap[size ?? 'md'], defaultIconColor, iconClassName)}
      />
    </div>
  );
}
