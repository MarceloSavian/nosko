import { Link, type LinkProps } from '@tanstack/react-router';
import type { VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { buttonVariants } from '@/presentation/components/Button';
import { cn } from '@/presentation/lib/cn';

type Props = VariantProps<typeof buttonVariants> &
  Omit<LinkProps, 'className'> & {
    children: ReactNode;
    className?: string;
  };

export function LinkButton({ variant, size, fullWidth, className, children, ...rest }: Props) {
  return (
    <Link className={cn(buttonVariants({ variant, size, fullWidth }), className)} {...rest}>
      {children}
    </Link>
  );
}
