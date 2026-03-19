/* @refresh reload */
import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { SelectMenu } from './components/ui/select-menu';
import { Button } from './components/ui/button';
import { ColorPicker } from './components/ui/color-picker';
import { useToaster } from './components/ui/toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './components/ui/card';
import { Badge } from './components/ui/badge';

type Settings = {
  activeProvider: string;
  pinnedVersion: string;
  palette: Array<{ token: string; label: string; hex: string }>;
  defaultToken: string;
};

const MIN_LOADING_MS = 400;

async function withMinDelay<T>(promise: Promise<T>, minMs = MIN_LOADING_MS): Promise<T> {
  const start = Date.now();
  const result = await promise;
  const elapsed = Date.now() - start;
  if (elapsed < minMs) {
    await new Promise((r) => setTimeout(r, minMs - elapsed));
  }
  return result;
}

function SettingsUI({ initialSettings }: { initialSettings: Settings }) {
  const toastRef = React.useRef<HTMLDivElement | null>(null);
  const { push, portal } = useToaster(toastRef.current);

  const [aLabel, setALabel] = React.useState(initialSettings.palette[0]?.label || 'Primary');
  const [aHex, setAHex] = React.useState(initialSettings.palette[0]?.hex || '#18181b');
  const [bLabel, setBLabel] = React.useState(initialSettings.palette[1]?.label || 'Secondary');
  const [bHex, setBHex] = React.useState(initialSettings.palette[1]?.hex || '#71717a');
  const [cLabel, setCLabel] = React.useState(initialSettings.palette[2]?.label || 'Accent');
  const [cHex, setCHex] = React.useState(initialSettings.palette[2]?.hex || '#4f46e5');
  const [def, setDef] = React.useState(initialSettings.defaultToken || 'A');

  const [saving, setSaving] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);

  const restBase =
    (window as any).openicon_api?.root?.replace(/\/$/, '') || '/wp-json';
  const nonce = (window as any).openicon_api?.nonce || '';
  const apiBase = `${restBase}/openicon/v1`;

  // Premium provider info for upsell
  const premiumProviders = [
    { key: 'lucide', label: 'Lucide Icons', count: '1,500+' },
    { key: 'tabler', label: 'Tabler Icons', count: '5,200+' },
  ];

  // Save settings
  const handleSave = React.useCallback(async () => {
    setSaving(true);
    try {
      const settings = {
        activeProvider: 'heroicons',
        pinnedVersion: 'latest',
        palette: [
          { token: 'A', label: aLabel, hex: aHex },
          { token: 'B', label: bLabel, hex: bHex },
          { token: 'C', label: cLabel, hex: cHex },
        ],
        defaultToken: def,
      };

      const response = await withMinDelay(
        fetch(`${apiBase}/settings`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': nonce,
          },
          body: JSON.stringify(settings),
        })
      );

      const data = await response.json();

      if (response.ok && data.success) {
        push({
          type: 'success',
          title: 'Saved',
          message: 'Settings updated.',
        });
      } else {
        throw new Error(data.message || 'Failed to save');
      }
    } catch {
      push({
        type: 'error',
        title: 'Error',
        message: 'Failed to save settings.',
      });
    } finally {
      setSaving(false);
    }
  }, [aLabel, aHex, bLabel, bHex, cLabel, cHex, def, apiBase, nonce, push]);

  // Restore defaults
  const handleRestore = React.useCallback(async () => {
    setRestoring(true);
    try {
      const response = await withMinDelay(
        fetch(`${apiBase}/settings/restore`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': nonce,
          },
        })
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state with defaults
        setALabel('Primary');
        setAHex('#18181b');
        setBLabel('Secondary');
        setBHex('#71717a');
        setCLabel('Accent');
        setCHex('#4f46e5');
        setDef('A');

        push({
          type: 'success',
          title: 'Restored',
          message: 'Defaults restored.',
        });
      } else {
        throw new Error('Failed to restore');
      }
    } catch {
      push({
        type: 'error',
        title: 'Error',
        message: 'Failed to restore defaults.',
      });
    } finally {
      setRestoring(false);
    }
  }, [apiBase, nonce, push]);

  const controlClass = 'max-w-[520px]';

  return (
    <div className='openicon-settings-ui mt-3'>
      {portal}
      <div className='space-y-6 max-w-[576px]'>
        {/* Upgrade Banner */}
        <Card className='border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50'>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-emerald-800'>
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M13 10V3L4 14h7v7l9-11h-7z'
                />
              </svg>
              Unlock More Icons
            </CardTitle>
            <CardDescription className='text-emerald-700'>
              Upgrade to ACF Open Icons Premium for access to 6,000+ icons
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex flex-wrap gap-2'>
              {premiumProviders.map((p) => (
                <Badge
                  key={p.key}
                  variant='secondary'
                  className='bg-white border border-emerald-200'
                >
                  {p.label} ({p.count})
                </Badge>
              ))}
            </div>
            <p className='text-sm text-emerald-700'>
              Plus: Provider switching, icon migration tools, and priority
              support.
            </p>
            <a
              href='https://acfopenicons.com?utm_source=plugin&utm_medium=settings&utm_campaign=lite'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white hover:text-white rounded-md font-medium transition-colors text-sm no-underline'
            >
              Get Premium
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M14 5l7 7m0 0l-7 7m7-7H3'
                />
              </svg>
            </a>
          </CardContent>
        </Card>

        {/* Icon Set */}
        <div className='rounded-md border bg-white p-4'>
          <div className='grid gap-3'>
            <div className='grid grid-cols-[180px_1fr] items-center gap-3'>
              <Label>Icon Set</Label>
              <SelectMenu
                value='heroicons'
                onChange={() => {}}
                items={[
                  { value: 'heroicons', label: 'Heroicons' },
                  { value: 'lucide', label: 'Lucide Icons', disabled: true, badge: 'Premium' },
                  { value: 'tabler', label: 'Tabler Icons', disabled: true, badge: 'Premium' },
                  { value: 'custom', label: 'Custom Icons', disabled: true, badge: 'Premium' },
                ]}
                className={controlClass}
              />
            </div>
          </div>
        </div>

        {/* Palette Colours */}
        <div className='rounded-md border bg-white p-4'>
          <Label className='block mb-3'>Palette colours</Label>
          <div className='grid gap-3'>
            <div className='grid grid-cols-[180px_1fr_80px] items-center gap-3'>
              <span className='text-sm text-muted-foreground'>Token A</span>
              <Input
                value={aLabel}
                onChange={(e) => setALabel(e.target.value)}
                className={controlClass}
              />
              <ColorPicker
                value={aHex}
                onChange={(e) => setAHex(e.target.value)}
              />
            </div>
            <div className='grid grid-cols-[180px_1fr_80px] items-center gap-3'>
              <span className='text-sm text-muted-foreground'>Token B</span>
              <Input
                value={bLabel}
                onChange={(e) => setBLabel(e.target.value)}
                className={controlClass}
              />
              <ColorPicker
                value={bHex}
                onChange={(e) => setBHex(e.target.value)}
              />
            </div>
            <div className='grid grid-cols-[180px_1fr_80px] items-center gap-3'>
              <span className='text-sm text-muted-foreground'>Token C</span>
              <Input
                value={cLabel}
                onChange={(e) => setCLabel(e.target.value)}
                className={controlClass}
              />
              <ColorPicker
                value={cHex}
                onChange={(e) => setCHex(e.target.value)}
              />
            </div>
            <div className='grid grid-cols-[180px_1fr] items-center gap-3'>
              <Label>Default palette token</Label>
              <SelectMenu
                value={def}
                onChange={setDef}
                items={[{ value: 'A' }, { value: 'B' }, { value: 'C' }]}
                className={controlClass}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-3'>
          <Button
            onClick={handleSave}
            variant='primary'
            disabled={saving}
          >
            <span className={saving ? 'invisible' : ''}>Save Changes</span>
            {saving && <span className='absolute'>Saving...</span>}
          </Button>
          <Button
            onClick={handleRestore}
            variant='secondary'
            className='border-red-200 text-red-700 hover:bg-red-50'
            disabled={restoring}
          >
            <span className={restoring ? 'invisible' : ''}>Restore Defaults</span>
            {restoring && <span className='absolute'>Restoring...</span>}
          </Button>
        </div>

        {/* Toast container - below buttons */}
        <div ref={toastRef} />
      </div>
    </div>
  );
}

function mount() {
  const wrap = document.querySelector('.wrap');
  if (!wrap) {
    return;
  }

  // Get initial settings from the global variable set by PHP
  const initialSettings: Settings = (window as any).__OPENICON_SETTINGS__ || {
    activeProvider: 'heroicons',
    pinnedVersion: 'latest',
    palette: [
      { token: 'A', label: 'Primary', hex: '#18181b' },
      { token: 'B', label: 'Secondary', hex: '#71717a' },
      { token: 'C', label: 'Accent', hex: '#4f46e5' },
    ],
    defaultToken: 'A',
  };

  // Hide the PHP-rendered forms
  const forms = wrap.querySelectorAll('form');
  forms.forEach((form) => {
    (form as HTMLElement).style.display = 'none';
  });

  const existing = wrap.querySelector('.openicon-settings-ui');
  if (existing) {
    return; // avoid duplicates
  }

  const mountEl = document.createElement('div');
  wrap.appendChild(mountEl);
  createRoot(mountEl).render(<SettingsUI initialSettings={initialSettings} />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
