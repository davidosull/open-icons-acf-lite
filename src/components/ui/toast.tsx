import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

type Toast = {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info';
};

export function useToaster(inlineHost?: HTMLElement | null) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const remove = React.useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, _removing: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const push = React.useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;
      setToasts((prev) => [...prev, { id, ...t }]);
      setTimeout(() => remove(id), 5000);
    },
    [remove]
  );

  if (!mounted) {
    return { push, portal: null } as any;
  }

  const isInline = !!inlineHost;
  const containerClass = cn(
    isInline
      ? 'mb-4 space-y-2 max-w-[576px]'
      : 'fixed top-4 right-4 z-[100005] space-y-2 pointer-events-none'
  );

  const portalContent = (
    <div className={containerClass}>
      {toasts.map((t) => (
        <div
          key={t.id}
          data-state={(t as any)._removing ? 'closed' : 'open'}
          className={cn(
            'acfoil-toast',
            isInline ? 'w-full' : 'w-[300px] pointer-events-auto',
            'rounded-md border p-4',
            t.type === 'success' && 'bg-emerald-50 border-emerald-200 text-emerald-800',
            t.type === 'error' && 'bg-red-50 border-red-200 text-red-800',
            (!t.type || t.type === 'info') && 'bg-blue-50 border-blue-200 text-blue-800'
          )}
        >
            {t.title && (
            <div className='mb-1 text-sm font-semibold'>
                {t.title}
              </div>
            )}
          <div className='text-sm'>{t.message}</div>
        </div>
      ))}
    </div>
  );

  if (isInline && inlineHost) {
    const portal = createPortal(portalContent, inlineHost);
    return { push, portal } as const;
  }

  const portal = createPortal(portalContent, document.body);
  return { push, portal } as const;
}
