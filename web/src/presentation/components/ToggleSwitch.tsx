import { cn } from '@/presentation/lib/cn';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
};

export function ToggleSwitch({ checked, onChange, className }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer shrink-0',
        checked ? 'bg-secondary' : 'bg-outline-variant',
        className,
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );
}
