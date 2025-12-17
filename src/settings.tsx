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

function SettingsUI({
  form,
  purgeForm,
}: {
  form: HTMLFormElement;
  purgeForm: HTMLFormElement | null;
}) {
  const opt = 'acf_open_icons_lite_settings';
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

  // Hide native buttons
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

  // Toast on save/purge/restore
  React.useEffect(() => {
    const url = new URL(window.location.href);
    const settingsSaved = url.searchParams.get('settings-updated');
    const purged = url.searchParams.get('purged');
    const restored = url.searchParams.get('restored');

    if (settingsSaved) {
      push({ type: 'success', title: 'Saved', message: 'Settings updated.' });
      url.searchParams.delete('settings-updated');
      window.history.replaceState({}, '', url.toString());
    }
    if (purged) {
      push({ type: 'success', title: 'Cache', message: 'Icon cache purged.' });
      url.searchParams.delete('purged');
      window.history.replaceState({}, '', url.toString());
    }
    if (restored) {
      push({ type: 'success', title: 'Restored', message: 'Defaults restored.' });
      url.searchParams.delete('restored');
      window.history.replaceState({}, '', url.toString());
      setTimeout(() => window.location.reload(), 2500);
    }
  }, [push]);

  const controlClass = 'max-w-[520px]';

  return (
    <div className='acfoil-settings-ui mt-3'>
      <div ref={toastRef} />
      {portal}
      <div className='space-y-6 max-w-[576px]'>
        {/* Icon Library Info */}
        <Card>
          <CardHeader>
            <CardTitle>Icon Library</CardTitle>
            <CardDescription>
              ACF Open Icons - Lite includes 300+ Heroicons.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-gray-600'>
              Using <strong>Heroicons</strong> by Tailwind Labs (MIT License)
            </p>
          </CardContent>
        </Card>

        {/* Palette Settings */}
        <div className='rounded-md border bg-white p-4'>
          <Label className='block mb-3'>Palette Colours</Label>
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

        {/* Upgrade to Pro Prompt */}
        <Card className='border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50'>
          <CardHeader>
            <CardTitle className='text-indigo-900'>Unlock More Icons</CardTitle>
            <CardDescription className='text-indigo-700'>
              Upgrade to ACF Open Icons Pro for access to 15,000+ icons from Lucide, Tabler, and Heroicons.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant='primary'
              onClick={() => window.open('https://acfopenicons.com/#pricing', '_blank')}
            >
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function mount() {
  const wrap = document.querySelector('.wrap');
  if (!wrap) return;

  const forms = wrap.querySelectorAll('form');
  const form = forms[0] as HTMLFormElement | null;
  const purgeForm = (forms[1] as HTMLFormElement) || null;
  if (!form) return;

  const table = form.querySelector('table.form-table') as HTMLElement | null;
  if (table) table.style.display = 'none';

  const existing = wrap.querySelector('.acfoil-settings-ui');
  if (existing) return;

  const mountEl = document.createElement('div');
  wrap.insertBefore(mountEl, form);
  createRoot(mountEl).render(<SettingsUI form={form} purgeForm={purgeForm} />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
