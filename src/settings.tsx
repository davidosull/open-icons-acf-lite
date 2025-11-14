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

  // Get available providers from the native select element
  const providerSelectEl = q('[activeProvider]') as HTMLSelectElement;
  const providerOptions = providerSelectEl
    ? Array.from(providerSelectEl.options).map((opt) => ({
        value: opt.value,
        label: opt.text,
      }))
    : [];

  const providerEl = q('[activeProvider]') as HTMLSelectElement;
  const versionEl = q('[pinnedVersion]') as HTMLInputElement;
  const pALabelEl = q('[palette][0][label]') as HTMLInputElement;
  const pAHexEl = q('[palette][0][hex]') as HTMLInputElement;
  const pBLabelEl = q('[palette][1][label]') as HTMLInputElement;
  const pBHexEl = q('[palette][1][hex]') as HTMLInputElement;
  const pCLabelEl = q('[palette][2][label]') as HTMLInputElement;
  const pCHexEl = q('[palette][2][hex]') as HTMLInputElement;
  const defaultTokenEl = q('[defaultToken]') as HTMLSelectElement;

  const [provider, setProvider] = React.useState(providerEl?.value || 'lucide');
  const [aLabel, setALabel] = React.useState(pALabelEl?.value || 'Primary');
  const [aHex, setAHex] = React.useState(pAHexEl?.value || '#111111');
  const [bLabel, setBLabel] = React.useState(pBLabelEl?.value || 'Secondary');
  const [bHex, setBHex] = React.useState(pBHexEl?.value || '#888888');
  const [cLabel, setCLabel] = React.useState(pCLabelEl?.value || 'Accent');
  const [cHex, setCHex] = React.useState(pCHexEl?.value || '#0ea5e9');
  const [def, setDef] = React.useState(defaultTokenEl?.value || 'A');

  React.useEffect(() => {
    if (providerEl) providerEl.value = provider;
  }, [provider]);
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
    // WP notices removed from PHP; only custom toasts show
  }, []);

  // Mark intents so we can show toasts after redirect regardless of query params
  React.useEffect(() => {
    const onSubmit = () => {
      try {
        sessionStorage.setItem('acfoi_toast_after', 'settings_saved');
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

    // SessionStorage fallback when WP doesn't append query params
    let ss = '';
    try {
      ss = sessionStorage.getItem('acfoi_toast_after') || '';
      if (ss) sessionStorage.removeItem('acfoi_toast_after');
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
      // Delay reload so toast is visible
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
        <div className='rounded-md border bg-white p-4'>
          <div className='grid gap-4'>
            <div className='grid grid-cols-[180px_1fr] items-center gap-3'>
              <Label>Icon Set</Label>
              <SelectMenu
                value={provider}
                onChange={setProvider}
                items={providerOptions}
                className={controlClass}
              />
            </div>
          </div>
        </div>

        <div className='rounded-md border bg-white p-4'>
          <Label className='block mb-3'>Palette colors</Label>
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
                  'form input[name="action"][value="acfoi_restore_defaults"]'
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
  if (!wrap) return;
  const forms = wrap.querySelectorAll('form');
  const form = forms[0] as HTMLFormElement | null;
  const purgeForm = (forms[1] as HTMLFormElement) || null;
  if (!form) return;
  const table = form.querySelector('table.form-table') as HTMLElement | null;
  if (table) table.style.display = 'none';
  const existing = wrap.querySelector('.acfoi-settings-ui');
  if (existing) return; // avoid duplicates
  const mount = document.createElement('div');
  wrap.insertBefore(mount, form);
  createRoot(mount).render(<SettingsUI form={form} purgeForm={purgeForm} />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
