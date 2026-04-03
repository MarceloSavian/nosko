import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';
import { activateLocale } from '@/infra/i18n/i18n';
import { Icon } from '@/presentation/components/Icon';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useLingui();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentCode = (i18n.locale ?? 'en').toUpperCase().slice(0, 2);

  const handleSelect = async (code: string) => {
    await activateLocale(code);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="flex items-center gap-1 text-sm font-semibold text-primary/70 hover:text-primary transition-colors cursor-pointer"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Icon name="language" className="text-xl" />
        <span>{currentCode}</span>
        <Icon name="expand_more" className="text-base" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-outline-variant/20 py-1 min-w-[160px] z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                i18n.locale === lang.code
                  ? 'text-primary bg-surface-container-high'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
              }`}
              onClick={() => handleSelect(lang.code)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
