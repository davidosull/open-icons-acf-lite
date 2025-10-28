import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

type Toast = {
  id: number;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info';
};

export function useToaster(inlineHost?: HTMLElement | null) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    console.log('[ABI Toast] Mounting toast system');
    setMounted(true);
  }, []);

  const remove = (id: number) => {
    console.log('[ABI Toast] Removing toast', id);
    setToasts((t) => t.filter((x) => x.id !== id));
  };

  const push = (t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    console.log('[ABI Toast] Pushing toast', { id, ...t });
    setToasts((list) => {
      const next = [...list, { id, ...t }];
      console.log('[ABI Toast] Toast state updated, count:', next.length);
      return next;
    });
    setTimeout(() => remove(id), 5000);
  };

  console.log(
    '[ABI Toast] Render - mounted:',
    mounted,
    'toasts count:',
    toasts.length
  );

  if (!mounted) {
    console.log('[ABI Toast] Not mounted yet, returning null portal');
    return { push, portal: null } as any;
  }

  const isInline = !!inlineHost;
  const containerClass = isInline
    ? 'mb-4 space-y-2 max-w-[576px]'
    : 'fixed top-4 right-4 z-[100005] space-y-2';

  const portalContent = (
    <div className={containerClass}>
      {toasts.length > 0 &&
        console.log('[ABI Toast] Rendering', toasts.length, 'toasts')}
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            isInline ? 'w-full' : 'pointer-events-auto w-[300px]',
            'overflow-hidden rounded-lg border',
            t.type === 'success' && 'bg-green-50 border-green-200',
            t.type === 'error' && 'bg-red-50 border-red-200',
            (!t.type || t.type === 'info') && 'bg-blue-50 border-blue-200'
          )}
        >
          <div className='p-4'>
            {t.title && (
              <div className='mb-1 text-sm font-semibold text-gray-900'>
                {t.title}
              </div>
            )}
            <div className='text-sm text-gray-700'>{t.message}</div>
          </div>
        </div>
      ))}
    </div>
  );

  if (isInline && inlineHost) {
    console.log('[ABI Toast] Rendering inline to host');
    const portal = createPortal(portalContent, inlineHost);
    return { push, portal } as const;
  }

  console.log('[ABI Toast] Creating portal to body');
  const portal = createPortal(portalContent, document.body);
  return { push, portal } as const;
}
