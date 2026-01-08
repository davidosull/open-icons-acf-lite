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
import { Alert, AlertTitle, AlertDescription } from './components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';

function SettingsUI({
  form,
  purgeForm,
}: {
  form: HTMLFormElement;
  purgeForm: HTMLFormElement | null;
}) {
  const opt = 'acf_open_icons_settings';
  const q = (n: string) =>
    form.querySelector<HTMLInputElement | HTMLSelectElement>(
      `[name="${opt}${n}"]`
    );

  const toastRef = React.useRef<HTMLDivElement | null>(null);
  const { push, portal } = useToaster(toastRef.current);

  const pALabelEl = q('[palette][0][label]') as HTMLInputElement;
  const pAHexEl = q('[palette][0][hex]') as HTMLInputElement;
  const pBLabelEl = q('[palette][1][label]') as HTMLInputElement;
  const pBHexEl = q('[palette][1][hex]') as HTMLInputElement;
  const pCLabelEl = q('[palette][2][label]') as HTMLInputElement;
  const pCHexEl = q('[palette][2][hex]') as HTMLInputElement;
  const defaultTokenEl = q('[defaultToken]') as HTMLSelectElement;

  const [aLabel, setALabel] = React.useState(pALabelEl?.value || 'Primary');
  const [aHex, setAHex] = React.useState(pAHexEl?.value || '#18181b');
  const [bLabel, setBLabel] = React.useState(pBLabelEl?.value || 'Secondary');
  const [bHex, setBHex] = React.useState(pBHexEl?.value || '#71717a');
  const [cLabel, setCLabel] = React.useState(pCLabelEl?.value || 'Accent');
  const [cHex, setCHex] = React.useState(pCHexEl?.value || '#34d399');
  const [def, setDef] = React.useState(defaultTokenEl?.value || 'A');

  // Tracking state
  const trackingStatus = (window as any).__ACFOIL_TRACKING__ || {
    enabled: false,
  };
  const [trackingEnabled, setTrackingEnabled] = React.useState(
    trackingStatus.enabled
  );
  const [togglingTracking, setTogglingTracking] = React.useState(false);

  const restBase =
    (window as any).wpApiSettings?.root?.replace(/\/$/, '') || '/wp-json';
  const nonce = (window as any).wpApiSettings?.nonce || '';

  // Premium provider info for upsell
  const premiumProviders = [
    { key: 'lucide', label: 'Lucide Icons', count: '1,500+' },
    { key: 'tabler', label: 'Tabler Icons', count: '5,200+' },
  ];

  // Toggle tracking
  const handleToggleTracking = React.useCallback(async () => {
    setTogglingTracking(true);
    try {
      const response = await fetch(
        `${restBase}/acf-open-icons/v1/tracking/toggle`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': nonce,
          },
          body: JSON.stringify({ enable: !trackingEnabled }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setTrackingEnabled(data.enabled);
        push({
          type: 'success',
          title: data.enabled ? 'Tracking Enabled' : 'Tracking Disabled',
          message: data.enabled
            ? 'Thank you for helping improve ACF Open Icons Lite!'
            : 'Usage tracking has been disabled.',
        });
      }
    } catch (error) {
      push({
        type: 'error',
        title: 'Error',
        message: 'Failed to update tracking preferences.',
      });
    } finally {
      setTogglingTracking(false);
    }
  }, [trackingEnabled, restBase, nonce, push]);

  React.useEffect(() => {
    if (pALabelEl) pALabelEl.value = aLabel;
  }, [aLabel]);
  React.useEffect(() => {
    if (pAHexEl) pAHexEl.value = aHex;
  }, [aHex]);
  React.useEffect(() => {
    if (pBLabelEl) pBLabelEl.value = bLabel;
  }, [bLabel]);
  React.useEffect(() => {
    if (pBHexEl) pBHexEl.value = bHex;
  }, [bHex]);
  React.useEffect(() => {
    if (pCLabelEl) pCLabelEl.value = cLabel;
  }, [cLabel]);
  React.useEffect(() => {
    if (pCHexEl) pCHexEl.value = cHex;
  }, [cHex]);
  React.useEffect(() => {
    if (defaultTokenEl) defaultTokenEl.value = def;
  }, [def]);

  // Hide native buttons and WP notices
  React.useEffect(() => {
    const buttons = Array.from(
      form.querySelectorAll(
        'p.submit input[type="submit"], .submit input[type="submit"], .submit button'
      )
    ) as HTMLElement[];
    buttons.forEach((b) => (b.style.display = 'none'));
    const allForms = document.querySelectorAll(
      'form[action*="admin-post.php"]'
    );
    allForms.forEach((f) => {
      const btns = Array.from(
        f.querySelectorAll('input[type="submit"], button')
      ) as HTMLElement[];
      btns.forEach((b) => (b.style.display = 'none'));
    });
  }, []);

  // Mark intents so we can show toasts after redirect
  React.useEffect(() => {
    const onSubmit = () => {
      try {
        sessionStorage.setItem('acfoil_toast_after', 'settings_saved');
      } catch {}
    };
    form.addEventListener('submit', onSubmit);
    return () => form.removeEventListener('submit', onSubmit);
  }, [form]);

  // Detect redirects after save/purge and show toast
  React.useEffect(() => {
    const url = new URL(window.location.href);
    const settingsSaved = url.searchParams.get('settings-updated');
    const purged = url.searchParams.get('purged');
    const restored = url.searchParams.get('restored');

    let ss = '';
    try {
      ss = sessionStorage.getItem('acfoil_toast_after') || '';
      if (ss) sessionStorage.removeItem('acfoil_toast_after');
    } catch {}

    if (settingsSaved) {
      push({
        type: 'success',
        title: 'Saved',
        message: 'Settings updated.',
      });
      url.searchParams.delete('settings-updated');
      window.history.replaceState({}, '', url.toString());
    } else if (ss === 'settings_saved') {
      push({
        type: 'success',
        title: 'Saved',
        message: 'Settings updated.',
      });
    }
    if (purged) {
      push({
        type: 'success',
        title: 'Cache',
        message: 'Icon cache purged.',
      });
      url.searchParams.delete('purged');
      window.history.replaceState({}, '', url.toString());
    }
    if (restored) {
      push({
        type: 'success',
        title: 'Restored',
        message: 'Defaults restored.',
      });
      url.searchParams.delete('restored');
      window.history.replaceState({}, '', url.toString());
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    }
  }, [push]);

  const controlClass = 'max-w-[520px]';

  return (
    <div className='acfoi-settings-ui mt-3'>
      <div ref={toastRef} />
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

        {/* Icon Set (Heroicons only) */}
        <div className='rounded-md border bg-white p-4'>
          <div className='grid gap-3'>
            <div className='grid grid-cols-[180px_1fr] items-center gap-3'>
              <Label>Icon Set</Label>
              <div className='flex items-center gap-2'>
                <Badge variant='success'>Heroicons</Badge>
                <span className='text-sm text-muted-foreground'>292 icons</span>
              </div>
            </div>
            <div className='grid grid-cols-[180px_1fr] items-start gap-3'>
              <span className='text-sm text-muted-foreground'>
                Premium icon sets
              </span>
              <div className='flex flex-wrap gap-3'>
                {premiumProviders.map((p) => (
                  <div
                    key={p.key}
                    className='flex items-center gap-1.5 text-xs text-zinc-400'
                  >
                    <svg
                      className='w-3.5 h-3.5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                      />
                    </svg>
                    {p.label}
                  </div>
                ))}
              </div>
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

        {/* Usage Tracking */}
        <div className='rounded-md border bg-white p-4'>
          <div className='grid gap-3'>
            <div className='grid grid-cols-[180px_1fr] items-center gap-3'>
              <Label>Usage Tracking</Label>
            </div>
            <div className='grid grid-cols-[180px_1fr] items-start gap-3'>
              <span className='text-sm text-muted-foreground'>
                Share usage data
              </span>
              <div className='flex items-start gap-3'>
                <button
                  type='button'
                  role='switch'
                  aria-checked={trackingEnabled}
                  onClick={handleToggleTracking}
                  disabled={togglingTracking}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    trackingEnabled ? 'bg-emerald-500' : 'bg-zinc-200'
                  } ${togglingTracking ? 'opacity-50 cursor-wait' : ''}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      trackingEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className='text-sm text-muted-foreground'>
                  {trackingEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <p className='text-xs text-zinc-400 col-span-full'>
              We collect: a hashed site URL, WordPress version, PHP version, and
              plugin version. No personal data is ever collected.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-3'>
          <Button onClick={() => form.requestSubmit()} variant='primary'>
            Save Changes
          </Button>
          {purgeForm && (
            <Button
              onClick={() => purgeForm.requestSubmit()}
              variant='secondary'
            >
              Purge Icon Cache
            </Button>
          )}
          <Button
            onClick={() => {
              const restoreForm = document
                .querySelector(
                  'form input[name="action"][value="acfoil_restore_defaults"]'
                )
                ?.closest('form') as HTMLFormElement | null;
              if (restoreForm) restoreForm.requestSubmit();
            }}
            variant='secondary'
            className='border-red-200 text-red-700 hover:bg-red-50'
          >
            Restore Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}

function mount() {
  const wrap = document.querySelector('.wrap');
  if (!wrap) {
    return;
  }
  const forms = wrap.querySelectorAll('form');
  const form = forms[0] as HTMLFormElement | null;
  const purgeForm = (forms[1] as HTMLFormElement) || null;
  if (!form) {
    return;
  }
  const table = form.querySelector('table.form-table') as HTMLElement | null;
  if (table) table.style.display = 'none';
  const existing = wrap.querySelector('.acfoi-settings-ui');
  if (existing) {
    return; // avoid duplicates
  }
  const mount = document.createElement('div');
  wrap.insertBefore(mount, form);
  createRoot(mount).render(<SettingsUI form={form} purgeForm={purgeForm} />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
