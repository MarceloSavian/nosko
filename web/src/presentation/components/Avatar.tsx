import { cva, type VariantProps } from 'class-variance-authority';
import { Icon } from '@/presentation/components/Icon';
import { cn } from '@/presentation/lib/cn';

const avatarVariants = cva('rounded-full flex items-center justify-center shrink-0', {
  variants: {
    size: {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
    },
    tone: {
      default: 'bg-secondary-container',
      primary: 'bg-primary-fixed-dim',
      tertiary: 'bg-tertiary-fixed-dim',
    },
  },
  defaultVariants: {
    size: 'md',
    tone: 'default',
  },
});

const iconSizeMap = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
};

type Props = VariantProps<typeof avatarVariants> & {
  src?: string;
  alt?: string;
  icon?: string;
  className?: string;
};

export function Avatar({ size = 'md', tone, src, alt, icon = 'person', className }: Props) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? ''}
        className={cn(avatarVariants({ size, tone }), 'object-cover', className)}
      />
    );
  }

  return (
    <div className={cn(avatarVariants({ size, tone }), className)}>
      <Icon name={icon} filled className={`text-secondary ${iconSizeMap[size ?? 'md']}`} />
    </div>
  );
}
