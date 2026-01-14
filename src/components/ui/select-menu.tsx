import * as React from 'react';
import { cn } from '../../lib/utils';
import { Badge } from './badge';

export type SelectItem = {
  value: string;
  label?: string;
  hex?: string;
  disabled?: boolean;
  badge?: string;
};

export function SelectMenu({
  value,
  onChange,
  items = [],
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  items?: SelectItem[];
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const current = items.find((i) => i.value === value);

  return (
    <div className={cn('relative inline-block', className)} ref={ref}>
      <button
        type='button'
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <span className='flex items-center gap-2'>
          {current?.hex && (
            <span
              className='inline-block h-4 w-4 rounded-sm border'
              style={{ background: current.hex }}
            />
          )}
          {current?.label ?? current?.value ?? ''}
        </span>
        <svg width='12' height='12' viewBox='0 0 10 10' className='opacity-60'>
          <path
            d='M1 3l4 4 4-4'
            stroke='currentColor'
            strokeWidth='1.5'
            fill='none'
          />
        </svg>
      </button>
      {open && (
        <div className='absolute z-[100003] mt-1 w-full rounded-md border bg-white p-1 shadow'>
          {items.map((it) => (
            <button
              key={it.value}
              type='button'
              disabled={it.disabled}
              className={cn(
                'flex w-full items-center justify-start gap-2 rounded px-2 py-1 text-left text-sm',
                it.disabled
                  ? 'cursor-not-allowed text-zinc-400'
                  : 'hover:bg-zinc-50',
                it.value === value && !it.disabled && 'bg-zinc-50'
              )}
              onClick={() => {
                if (!it.disabled) {
                  onChange(it.value);
                  setOpen(false);
                }
              }}
            >
              {it.hex && (
                <span
                  className='inline-block h-4 w-4 rounded-sm border'
                  style={{ background: it.hex }}
                />
              )}
              {it.label ?? it.value}
              {it.badge && (
                <Badge variant='info' className='text-[10px] px-1.5 py-0'>
                  {it.badge}
                </Badge>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
