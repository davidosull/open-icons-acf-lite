import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import IconPicker from './components/IconPicker';

console.log('[ACFOI] Script loaded - V2');

function mountPickers() {
  console.log('[ACFOI] Mounting pickers…');
  const fields = document.querySelectorAll(
    '.abi-field:not([data-abi-mounted])'
  );
  console.log('[ACFOI] Found fields:', fields.length);

  fields.forEach((el) => {
    const host = el as HTMLElement;
    host.dataset.abiMounted = '1';

    const provider = host.dataset.abiProvider || 'lucide';
    const version = host.dataset.abiVersion || 'latest';

    console.log('[ACFOI] Mounting field:', host.id, 'provider:', provider);

    const preview = host.querySelector('[data-abi-preview]') as HTMLElement;
    const inputKey = host.querySelector(
      '[data-abi-key-out]'
    ) as HTMLInputElement;
    const inputSvg = host.querySelector(
      '[data-abi-svg-out]'
    ) as HTMLTextAreaElement;
    const openBtn = host.querySelector('[data-abi-open]') as HTMLButtonElement;

    console.log('[ACFOI] Found elements:', {
      preview: !!preview,
      inputKey: !!inputKey,
      inputSvg: !!inputSvg,
      openBtn: !!openBtn,
    });

    // Initial common list is embedded server-side on window
    const initialCommon: string[] = (window as any).__ACFOI_COMMON__ || [];
    console.log('[ACFOI] Common icons:', initialCommon.length);

    // Create a mount point for the React modal
    const mount = document.createElement('div');
    mount.id = `abi-mount-${host.id || Math.random().toString(36).slice(2)}`;
    document.body.appendChild(mount);

    // Create the React root once per field
    const root = createRoot(mount);

    root.render(
      <IconPicker
        provider={provider}
        version={version}
        initialCommon={initialCommon}
        onSelect={(item: {
          key: string;
          svg?: string;
          colour?: { token: string; hex: string };
        }) => {
          console.log(
            '[ACFOI] Icon selected:',
            item.key,
            'colour:',
            item.colour
          );
          if (inputKey) inputKey.value = item.key;
          if (inputSvg && item.svg) {
            // Apply colour to SVG before storing
            const coloured = item.colour?.hex || '#111111';
            const svgWithColor = item.svg.replace(
              /stroke="[^"]*"/g,
              `stroke="${coloured}"`
            );
            inputSvg.value = svgWithColor;
            console.log('[ACFOI] SVG stored with colour:', item.colour?.hex);
          }
          if (preview && item.svg) {
            // Apply the chosen colour from modal to preview
            const coloured = item.colour?.hex || '#111111';
            console.log('[ACFOI] Applying colour to preview:', coloured);
            // Apply colour to the SVG itself
            const svgWithColor = item.svg.replace(
              /stroke="[^"]*"/g,
              `stroke="${coloured}"`
            );
            preview.innerHTML = svgWithColor;
            preview.style.display = '';
            // Ensure preview box has correct centering and sizing
            preview.style.display = 'flex';
            (preview.style as any).alignItems = 'center';
            (preview.style as any).justifyContent = 'center';
            const svg = preview.firstElementChild as HTMLElement | null;
            if (svg) {
              svg.setAttribute('width', '24');
              svg.setAttribute('height', '24');
              console.log('[ACFOI] SVG dimensions set to 24x24');
            }
          }
          const clearBtn = host.querySelector(
            '[data-abi-clear]'
          ) as HTMLButtonElement;
          if (openBtn) {
            openBtn.style.display = '';
            openBtn.textContent = 'Change Icon';
          }
          if (clearBtn) clearBtn.style.display = '';
        }}
      />
    );

    // Attach open button click handler
    if (openBtn) {
      console.log('[ACFOI] Attaching click handler to button');
      const clickHandler = () => {
        console.log('[ACFOI] Button clicked, dispatching modal event');
        // Trigger modal via custom event
        window.dispatchEvent(
          new CustomEvent('abi-open-modal', {
            detail: { instanceId: host.dataset.abiInstanceId },
          })
        );
      };
      openBtn.addEventListener('click', clickHandler);
      const prewarm = () => {
        window.dispatchEvent(new CustomEvent('abi-prewarm'));
      };
      openBtn.addEventListener('mouseenter', prewarm, { passive: true });
      openBtn.addEventListener('focus', prewarm, { passive: true });
    } else {
      console.warn('[ACFOI] No open button found!');
    }
  });
  console.log('[ACFOI] Pickers mounted');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountPickers);
} else {
  mountPickers();
}

// ACF append support
(window as any).acf?.addAction?.('append', ($el: any) => {
  console.log('[ACFOI] ACF append event');
  mountPickers();
});

// Re-mount on ACF ready event
(window as any).acf?.addAction?.('ready', () => {
  console.log('[ACFOI] ACF ready event');
  mountPickers();
});

// Event delegation fallback: ensure clicks on [data-abi-open] trigger the modal
document.addEventListener(
  'click',
  (ev) => {
    const target = (ev.target as HTMLElement)?.closest?.(
      '[data-abi-open]'
    ) as HTMLButtonElement | null;
    if (!target) return;
    const host = target.closest('.abi-field') as HTMLElement | null;
    const instanceId = host?.dataset.abiInstanceId || host?.id || '';
    console.log('[ACFOI] Delegated click on Select Icon', { instanceId });
    window.dispatchEvent(
      new CustomEvent('abi-open-modal', { detail: { instanceId } })
    );
    ev.preventDefault();
  },
  true
);
