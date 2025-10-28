import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { cn } from '../../lib/utils';

type DialogProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  children: React.ReactNode;
};

export function Dialog(props: DialogProps) {
  return <>{props.children}</>;
}

export function DialogContent({
  className,
  children,
  open,
  onOpenChange,
}: React.PropsWithChildren<{
  className?: string;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}>) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange?.(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onOpenChange]);

  if (!open || !mounted) return null;
  return ReactDOM.createPortal(
    <div className='fixed inset-0 z-[100000]'>
      <div
        className='fixed inset-0 bg-black/40'
        onClick={() => onOpenChange?.(false)}
      />
      <div
        className={cn(
          'fixed left-1/2 top-1/2 z-[100001] w-full max-w-[760px] -translate-x-1/2 -translate-y-1/2 rounded border bg-white p-4 shadow',
          className
        )}
        role='dialog'
        aria-modal='true'
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-2', className)} {...props} />
);

export const DialogTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-base font-semibold px-2', className)}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';
