import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import IconPicker from './components/IconPicker';

function mountPickers() {
  const fields = document.querySelectorAll(
    '.acfoi-field:not([data-acfoi-mounted])'
  );

  // Simple registry to manage React roots per instance
  const registry: Record<string, { root: any; mount: HTMLElement }> = ((
    window as any
  ).__ACFOI_REGISTRY__ = (window as any).__ACFOI_REGISTRY__ || {});

  fields.forEach((el) => {
    const host = el as HTMLElement;

    const keyOut = host.querySelector(
      '[data-acfoi-key-out]'
    ) as HTMLInputElement | null;
    const isClone = !!host.closest('.acf-clone');
    const isHiddenTpl =
      host.style.display === 'none' &&
      host.closest('[data-type]')?.classList.contains('acf-field');
    const hasCloneIndex = !!keyOut?.name?.includes('acfcloneindex');

    // Skip template elements (ACF uses these for cloning)
    if (isClone || isHiddenTpl) {
      return;
    }

    // Skip if field hasn't been finalised (still has acfcloneindex)
    // ACF replaces acfcloneindex with actual indices when field is ready
    if (hasCloneIndex) {
      return; // Skip - field not finalised yet
    }

    // Ensure finalised fields have a unique instanceId and id (clones can duplicate IDs)
    let instanceId = host.dataset.acfoiInstanceId || host.id || '';
    const keyOutForId = host.querySelector(
      '[data-acfoi-key-out]'
    ) as HTMLInputElement | null;
    const stillCloneIndex = !!keyOutForId?.name?.includes('acfcloneindex');
    const idConflict =
      instanceId &&
      document.querySelectorAll(
        `.acfoi-field[data-acfoi-instance-id="${instanceId}"]`
      ).length > 1;
    if (!instanceId || idConflict || stillCloneIndex) {
      const newId = `acfoi_${Date.now().toString(16)}_${Math.random()
        .toString(36)
        .slice(2)}`;
      host.id = newId;
      host.dataset.acfoiInstanceId = newId;
      instanceId = newId;
    }

    host.dataset.acfoiMounted = '1';

    // CRITICAL: Check if we already have a React root for this instance ID
    // Properly unmount any existing root before creating a new one
    const existing = registry[instanceId];
    const existingMountId = `acfoi-mount-${instanceId}`;
    if (existing) {
      try {
        existing.root.unmount?.();
      } catch {}
      try {
        existing.mount.remove();
      } catch {}
      delete registry[instanceId];
    } else {
      const stray = document.getElementById(existingMountId);
      if (stray) {
        stray.remove();
      }
    }

    // Lite version always uses heroicons
    const provider = 'heroicons';
    const version = host.dataset.acfoiVersion || 'latest';
    const useLastColor = host.dataset.acfoiUseLastColor === '1';
    const fieldKey = host.dataset.acfoiFieldKey || '';
    const fieldGroupKey = host.dataset.acfoiFieldGroupKey || '';

    const preview = host.querySelector('[data-acfoi-preview]') as HTMLElement;
    const inputKey = host.querySelector(
      '[data-acfoi-key-out]'
    ) as HTMLInputElement;
    const inputSvg = host.querySelector(
      '[data-acfoi-svg-out]'
    ) as HTMLTextAreaElement;
    const openBtn = host.querySelector(
      '[data-acfoi-open]'
    ) as HTMLButtonElement;

    // Create a mount point for the React modal - use instance ID for consistency
    const mount = document.createElement('div');
    mount.id = existingMountId;
    document.body.appendChild(mount);

    // Create the React root once per field
    const root = createRoot(mount);

    root.render(
      <IconPicker
        provider={provider}
        version={version}
        instanceId={instanceId}
        useLastColor={useLastColor}
        fieldKey={fieldKey}
        fieldGroupKey={fieldGroupKey}
        onSelect={(item: {
          key: string;
          svg?: string;
          color?: { token: string; hex: string };
        }) => {
          // Re-query the LIVE DOM element by ID to handle ACF's DOM manipulation
          let liveHost = document.getElementById(host.id) as HTMLElement | null;
          if (!liveHost) {
            return;
          }

          // CRITICAL: Check if the field we found is still in clone/template state
          // ACF may have re-cloned it, or we mounted to a clone that became a template again
          const testInput = liveHost.querySelector(
            '[data-acfoi-key-out]'
          ) as HTMLInputElement | null;
          const isCloneState =
            testInput?.name.includes('acfcloneindex') || false;
          const isCloneElement = !!liveHost.closest('.acf-clone');

          // If we're operating on a clone, find the REAL field
          if (isCloneState || isCloneElement) {
            const instanceId = liveHost.dataset.acfoiInstanceId;
            const allFields = document.querySelectorAll('.acfoi-field');
            let actualField: HTMLElement | null = null;

            for (const field of allFields) {
              const f = field as HTMLElement;
              // Match by instance ID (which should be unique per real field)
              if (f.dataset.acfoiInstanceId === instanceId) {
                const testInp = f.querySelector(
                  '[data-acfoi-key-out]'
                ) as HTMLInputElement | null;
                const notClone = !f.closest('.acf-clone');
                const notCloneIndex = !testInp?.name.includes('acfcloneindex');
                if (notClone && notCloneIndex) {
                  actualField = f;
                  break;
                }
              }
            }

            if (actualField) {
              liveHost = actualField;
            }
          }

          const currentInputKey = liveHost.querySelector(
            '[data-acfoi-key-out]'
          ) as HTMLInputElement;
          const currentInputSvg = liveHost.querySelector(
            '[data-acfoi-svg-out]'
          ) as HTMLTextAreaElement;
          const currentPreview = liveHost.querySelector(
            '[data-acfoi-preview]'
          ) as HTMLElement;
          const currentOpenBtn = liveHost.querySelector(
            '[data-acfoi-open]'
          ) as HTMLButtonElement;
          const currentClearBtn = liveHost.querySelector(
            '[data-acfoi-clear]'
          ) as HTMLButtonElement;
          const colorTokenInput = liveHost.querySelector(
            '[data-acfoi-color-token-out]'
          ) as HTMLInputElement;

          // Always update the key input (even if SVG is not yet available)
          if (currentInputKey) {
            currentInputKey.value = item.key;
            currentInputKey.dispatchEvent(
              new Event('input', { bubbles: true })
            );
            currentInputKey.dispatchEvent(
              new Event('change', { bubbles: true })
            );
          }

          if (colorTokenInput && item.color?.token) {
            colorTokenInput.value = item.color.token;
            colorTokenInput.dispatchEvent(
              new Event('input', { bubbles: true })
            );
          }

          // If SVG is not available yet, show a loading state in the preview
          if (currentPreview && !item.svg && item.key) {
            // Show a placeholder or loading indicator
            currentPreview.innerHTML = '<div style="width:16px;height:16px;border:2px solid #ddd;border-top-color:#333;border-radius:50%;animation:spin 1.2s linear infinite;"></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
            // Remove display:none from style and ensure display:flex is set
            const styleAttr = currentPreview.getAttribute('style') || '';
            const styleParts = styleAttr.split(';').filter((s) => {
              const trimmed = s.trim();
              return trimmed && !trimmed.toLowerCase().startsWith('display');
            });
            styleParts.push(
              'display:flex',
              'align-items:center',
              'justify-content:center'
            );
            const newStyle = styleParts.join(';') + ';';
            currentPreview.setAttribute('style', newStyle);
          }

          // Helper function to apply colour to SVG (matches IconPicker logic)
          const applyColorToSvg = (svg: string, color: string): string => {
            if (!svg || !color) return svg;
            // Detect if icon uses fill or stroke (or both)
            const hasStroke = /\bstroke(?!-)\s*=/i.test(svg);
            const hasFill = /\bfill(?!-)\s*=/i.test(svg) && !/fill\s*=\s*["']none["']/i.test(svg);
            let result = svg;
            // Apply colour to stroke if present
            if (hasStroke) {
              result = result.replace(/\bstroke(?!-)\s*=\s*["']?[^"'\s>]*["']?/gi, `stroke="${color}"`);
            }
            // Apply colour to fill if present and not explicitly set to "none"
            if (hasFill) {
              result = result.replace(/\bfill(?!-)\s*=\s*["']?[^"'\s>]*["']?/gi, `fill="${color}"`);
            }
            return result;
          };

          if (currentInputSvg && item.svg) {
            const colored = item.color?.hex || '#111111';
            const svgWithColor = applyColorToSvg(item.svg, colored);
            currentInputSvg.value = svgWithColor;
            currentInputSvg.dispatchEvent(
              new Event('input', { bubbles: true })
            );
            currentInputSvg.dispatchEvent(
              new Event('change', { bubbles: true })
            );
          }

          // Update preview if SVG is available (even if called asynchronously after modal closes)
          if (currentPreview && item.svg) {
            const colored = item.color?.hex || '#111111';
            const svgWithColor = applyColorToSvg(item.svg, colored);
            currentPreview.innerHTML = svgWithColor;

            // Remove display:none from style and ensure display:flex is set
            const styleAttr = currentPreview.getAttribute('style') || '';
            const styleParts = styleAttr.split(';').filter((s) => {
              const trimmed = s.trim();
              return trimmed && !trimmed.toLowerCase().startsWith('display');
            });
            styleParts.push(
              'display:flex',
              'align-items:center',
              'justify-content:center'
            );
            const newStyle = styleParts.join(';') + ';';
            currentPreview.setAttribute('style', newStyle);

            const svg = currentPreview.firstElementChild as HTMLElement | null;
            if (svg) {
              svg.setAttribute('width', '24');
              svg.setAttribute('height', '24');
            }

            // Force a reflow
            void currentPreview.offsetHeight;
          }

          if (currentOpenBtn) {
            currentOpenBtn.style.display = '';
            currentOpenBtn.textContent = 'Change Icon';
          }

          if (currentClearBtn) {
            currentClearBtn.style.display = '';
          }
        }}
      />
    );

    // Record root to registry for proper lifecycle management
    registry[instanceId] = { root, mount };

    // Attach open button click handler - ensure only one listener per instance
    if (openBtn) {
      // Namespaced listener keys via dataset
      if ((openBtn as any).__acfoiBound__) {
        // Already bound for this instance
      } else {
        (openBtn as any).__acfoiBound__ = true;

        const clickHandler = () => {
          window.dispatchEvent(
            new CustomEvent('acfoi-open-modal', {
              detail: { instanceId },
            })
          );
        };
        openBtn.addEventListener('click', clickHandler);
        const prewarm = () => {
          window.dispatchEvent(new CustomEvent('acfoi-prewarm'));
        };
        openBtn.addEventListener('mouseenter', prewarm, { passive: true });
        openBtn.addEventListener('focus', prewarm, { passive: true });
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountPickers);
} else {
  mountPickers();
}

// ACF field lifecycle events - append_field fires AFTER field is finalised
(window as any).acf?.addAction?.('append_field', ($field: any) => {
  setTimeout(() => mountPickers(), 50);
});

// ready_field fires when field is ready and finalised
(window as any).acf?.addAction?.('ready_field', ($field: any) => {
  setTimeout(() => mountPickers(), 50);
});

// ACF ready event (initial page load)
(window as any).acf?.addAction?.('ready', () => {
  mountPickers();
});

// Event delegation fallback: ensure clicks on [data-acfoi-open] trigger the modal
document.addEventListener(
  'click',
  (ev) => {
    const target = (ev.target as HTMLElement)?.closest?.(
      '[data-acfoi-open]'
    ) as HTMLButtonElement | null;
    if (!target) return;
    const host = target.closest('.acfoi-field') as HTMLElement | null;
    const instanceId = host?.dataset.acfoiInstanceId || host?.id || '';
    window.dispatchEvent(
      new CustomEvent('acfoi-open-modal', { detail: { instanceId } })
    );
    ev.preventDefault();
  },
  true
);

// Event delegation for remove/clear button: ensure clicks on [data-acfoi-clear] work for dynamically added fields
document.addEventListener(
  'click',
  (ev) => {
    const target = (ev.target as HTMLElement)?.closest?.(
      '[data-acfoi-clear]'
    ) as HTMLButtonElement | null;
    if (!target) return;
    const host = target.closest('.acfoi-field') as HTMLElement | null;
    if (!host) return;

    // Re-query the LIVE DOM element to handle ACF's DOM manipulation
    const instanceId = host.dataset.acfoiInstanceId || host.id || '';
    let liveHost = document.getElementById(host.id) as HTMLElement | null;
    if (!liveHost) {
      // Fallback: try to find by instance ID
      liveHost = document.querySelector(
        `.acfoi-field[data-acfoi-instance-id="${instanceId}"]`
      ) as HTMLElement | null;
    }
    if (!liveHost) return;

    // Check if field is in clone state
    const testInput = liveHost.querySelector(
      '[data-acfoi-key-out]'
    ) as HTMLInputElement | null;
    const isCloneState =
      testInput?.name.includes('acfcloneindex') || false;
    const isCloneElement = !!liveHost.closest('.acf-clone');

    // If we're operating on a clone, find the REAL field
    if (isCloneState || isCloneElement) {
      const allFields = document.querySelectorAll('.acfoi-field');
      let actualField: HTMLElement | null = null;

      for (const field of allFields) {
        const f = field as HTMLElement;
        if (f.dataset.acfoiInstanceId === instanceId) {
          const testInp = f.querySelector(
            '[data-acfoi-key-out]'
          ) as HTMLInputElement | null;
          const notClone = !f.closest('.acf-clone');
          const notCloneIndex = !testInp?.name.includes('acfcloneindex');
          if (notClone && notCloneIndex) {
            actualField = f;
            break;
          }
        }
      }

      if (actualField) {
        liveHost = actualField;
      }
    }

    // Clear the icon data
    const keyInput = liveHost.querySelector(
      '[data-acfoi-key-out]'
    ) as HTMLInputElement | null;
    const svgInput = liveHost.querySelector(
      '[data-acfoi-svg-out]'
    ) as HTMLTextAreaElement | null;
    const tokenInput = liveHost.querySelector(
      '[data-acfoi-color-token-out]'
    ) as HTMLInputElement | null;
    const preview = liveHost.querySelector(
      '[data-acfoi-preview]'
    ) as HTMLElement | null;
    const openBtn = liveHost.querySelector(
      '[data-acfoi-open]'
    ) as HTMLButtonElement | null;
    const clearBtn = liveHost.querySelector(
      '[data-acfoi-clear]'
    ) as HTMLButtonElement | null;

    if (keyInput) {
      keyInput.value = '';
      keyInput.dispatchEvent(new Event('input', { bubbles: true }));
      keyInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (svgInput) {
      svgInput.value = '';
      svgInput.dispatchEvent(new Event('input', { bubbles: true }));
      svgInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (tokenInput) {
      tokenInput.value = '';
      tokenInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (preview) {
      preview.innerHTML = '';
      const styleAttr = preview.getAttribute('style') || '';
      const styleParts = styleAttr.split(';').filter((s) => {
        const trimmed = s.trim();
        return trimmed && !trimmed.toLowerCase().startsWith('display');
      });
      styleParts.push('display:none');
      const newStyle = styleParts.join(';') + ';';
      preview.setAttribute('style', newStyle);
    }

    if (openBtn) {
      openBtn.style.display = '';
      openBtn.textContent = 'Select Icon';
    }

    if (clearBtn) {
      clearBtn.style.display = 'none';
    }

    ev.preventDefault();
  },
  true
);
