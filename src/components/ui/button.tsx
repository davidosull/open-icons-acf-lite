import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const base =
      'inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    const styles =
      variant === 'secondary'
        ? 'bg-white text-zinc-900 border hover:bg-zinc-50'
        : 'bg-blue-600 text-white hover:bg-blue-700';
    return (
      <button className={cn(base, styles, className)} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button };
