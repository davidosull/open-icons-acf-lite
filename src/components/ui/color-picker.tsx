import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ColorPickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
  ({ className, value, onChange, ...props }, ref) => {
    React.useEffect(() => {
      // Debug: confirm component is mounted (should log three times on settings page)
      // eslint-disable-next-line no-console
      console.log('[ACFOI Settings] ColorPicker mounted with', value);
    }, []);

    return (
      <input
        data-abi-colorpicker
        type='color'
        value={value}
        onChange={onChange}
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background cursor-pointer',
          className
        )}
        style={{
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          appearance: 'none',
        }}
        {...props}
      />
    );
  }
);
ColorPicker.displayName = 'ColorPicker';

export { ColorPicker };
