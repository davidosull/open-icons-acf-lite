import * as React from 'react';
import { flushSync } from 'react-dom';
import { DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { SelectMenu } from './ui/select-menu';

type IconItem = {
  key: string;
  svg?: string;
  color?: { token: string; hex: string };
};

function useRestBase() {
  const rest = (window as any).wpApiSettings?.root || '/wp-json/';
  return rest.replace(/\/$/, '');
}

// Hook for recently used icons (stored in localStorage)
function useRecentIcons(
  provider: string,
  version: string,
  modalOpen?: boolean
) {
  const storageKey = `acfoi_recent_${provider}@${version}`;
  const [recent, setRecent] = React.useState<string[]>([]);

  const loadRecent = React.useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecent(parsed.slice(0, 8)); // Last 8 icons
          return;
        }
      }
      setRecent([]);
    } catch {
      setRecent([]);
    }
  }, [storageKey]);

  // Load on mount or when storageKey changes
  React.useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  // Reload when modal opens to ensure we have the latest
  React.useEffect(() => {
    if (modalOpen) {
      loadRecent();
    }
  }, [modalOpen, loadRecent]);

  const addRecent = React.useCallback(
    (key: string) => {
      setRecent((prev) => {
        const next = [key, ...prev.filter((k) => k !== key)].slice(0, 8);
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [storageKey]
  );

  return { recent, addRecent };
}

// Skeleton loader component
function IconSkeleton() {
  return (
    <div className='flex flex-col aspect-square items-center justify-center gap-1 rounded-lg p-3 animate-pulse'>
      <div className='w-6 h-6 bg-zinc-200 rounded' />
      <div className='h-3 w-16 bg-zinc-200 rounded mt-1' />
    </div>
  );
}

// Utility function to detect field context from DOM
function getFieldContext(instanceId: string): {
  fieldGroupKey: string;
  flexibleLayout: string | null;
  flexibleLayoutInstanceIndex: string | number | null; // Can be numeric or alphanumeric ID
  flexibleContentFieldKey: string | null;
  repeaterKey: string | null;
  repeaterRowIndex: string | number | null; // Can be numeric or alphanumeric ID
} {
  const field = document.querySelector(
    `.acfoi-field[data-acfoi-instance-id="${instanceId}"]`
  ) as HTMLElement | null;
  if (!field) {
    return {
      fieldGroupKey: '',
      flexibleLayout: null,
      flexibleLayoutInstanceIndex: null,
      flexibleContentFieldKey: null,
      repeaterKey: null,
      repeaterRowIndex: null,
    };
  }

  // Get field group key from data attribute (set by PHP)
  let fieldGroupKey = field.dataset.acfoiFieldGroupKey || '';

  // Get the input element to parse the name path
  const keyInput = field.querySelector('[data-acfoi-key-out]') as HTMLInputElement | null;
  const inputName = keyInput?.name || '';

  // If not set, try to detect from DOM structure
  // ACF may add field group info to the form or field wrapper
  if (!fieldGroupKey) {
    // Try to find field group key from ACF's data attributes
    const form = field.closest('form') as HTMLElement | null;
    if (form) {
      // ACF sometimes stores field group key in form data
      const acfForm = form.querySelector('[data-key]') as HTMLElement | null;
      if (acfForm) {
        fieldGroupKey = acfForm.dataset.key || '';
      }
    }

    // Fallback: use a hash of the field's name path as a unique identifier
    if (!fieldGroupKey && inputName) {
      // Extract field group from input name path (e.g., "acf[field_123][field_456]")
      const nameMatch = inputName.match(/acf\[([^\]]+)\]/);
      if (nameMatch && nameMatch[1]) {
        // Use first part of path as field group identifier
        fieldGroupKey = nameMatch[1].split('][')[0] || '';
      }
    }
  }

  // Detect flexible content layout
  // ACF adds data-layout attribute to flexible content layouts
  let flexibleLayout: string | null = null;
  let flexibleLayoutInstanceIndex: number | null = null;
  let flexibleContentFieldKey: string | null = null;
  const flexibleLayoutEl = field.closest('[data-layout]') as HTMLElement | null;
  if (flexibleLayoutEl) {
    flexibleLayout = flexibleLayoutEl.dataset.layout || null;

    // Extract flexible content field key and instance identifier
    // ACF structure: acf[flexible_field_key][instance_id][layout_name][...]
    // Note: The instance ID parsing from input name is unreliable due to nested field structures
    // We'll use DOM-based identification as the primary method
    if (flexibleLayoutEl && flexibleLayout) {
      // Method 1: Try to get instance index from DOM position
      // Find the flexible content parent and count layout instances
      const flexibleContentEl = flexibleLayoutEl.closest('[data-type="flexible_content"]') as HTMLElement | null;
      if (flexibleContentEl) {
        // Get all layout instances of this type within the flexible content field
        const allLayouts = flexibleContentEl.querySelectorAll(`[data-layout="${flexibleLayout}"]`);
        // Find the index of this specific layout instance
        let instanceIndex = -1;
        for (let i = 0; i < allLayouts.length; i++) {
          if (allLayouts[i].contains(field) || allLayouts[i] === flexibleLayoutEl || flexibleLayoutEl.contains(allLayouts[i])) {
            instanceIndex = i;
            break;
          }
        }
        if (instanceIndex >= 0) {
          flexibleLayoutInstanceIndex = instanceIndex;
        }
      }

      // Method 2: Try data attributes (fallback)
      if (flexibleLayoutInstanceIndex === null) {
        const layoutInstanceId = flexibleLayoutEl?.dataset?.id ||
                                 flexibleLayoutEl?.getAttribute('data-id') ||
                                 flexibleLayoutEl?.closest('[data-id]')?.getAttribute('data-id');

        if (layoutInstanceId) {
          const numericIndex = parseInt(layoutInstanceId, 10);
          flexibleLayoutInstanceIndex = !isNaN(numericIndex) && layoutInstanceId === numericIndex.toString()
            ? numericIndex
            : layoutInstanceId;
        }
      }

      // Method 3: Try parsing from input name (last resort)
      if (flexibleLayoutInstanceIndex === null && inputName) {
        // Try to find layout name in the path and extract instance ID before it
        // Pattern: ...][instance_id][layout_name][...]
        const escapedLayout = flexibleLayout.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const layoutMatch = inputName.match(new RegExp(`\\[([^\\]]+)\\]\\[${escapedLayout}\\]`));
        if (layoutMatch) {
          const instanceIdStr = layoutMatch[1];
          // Only use if it doesn't look like a field key
          if (!instanceIdStr.startsWith('field_')) {
            const numericIndex = parseInt(instanceIdStr, 10);
            flexibleLayoutInstanceIndex = !isNaN(numericIndex) && instanceIdStr === numericIndex.toString()
              ? numericIndex
              : instanceIdStr;
          }
        }
      }

      // Debug logging
      if (typeof window !== 'undefined' && (window as any).__ACFOI_DEBUG__) {
        console.log('[ACFOI] Flexible extraction:', {
          inputName,
          flexibleLayout,
          flexibleLayoutInstanceIndex,
          flexibleContentFieldKey,
          allLayoutsCount: flexibleContentEl ? flexibleContentEl.querySelectorAll(`[data-layout="${flexibleLayout}"]`).length : 0,
        });
      }
    }

    // Fallback: try to get flexible content field key from DOM
    if (!flexibleContentFieldKey) {
      const flexibleContentEl = flexibleLayoutEl.closest('[data-type="flexible_content"]') as HTMLElement | null;
      if (flexibleContentEl) {
        flexibleContentFieldKey = flexibleContentEl.dataset.key || flexibleContentEl.dataset.name || null;
      }
    }
  }

  // Detect repeater field
  // ACF adds data-type="repeater" to repeater fields
  let repeaterKey: string | null = null;
  let repeaterRowIndex: number | null = null;
  const repeaterEl = field.closest('[data-type="repeater"]') as HTMLElement | null;
  if (repeaterEl) {
    // Try to get the repeater field key from data-key or data-name
    repeaterKey = repeaterEl.dataset.key || repeaterEl.dataset.name || null;

    // Extract repeater row index from input name
    // Pattern for repeater: acf[field_group][repeater_key][row_index][field_key]
    // Pattern for repeater in flexible: acf[field_group][flexible_key][flex_index][layout][repeater_key][row_index][field_key]
    if (inputName) {
      if (flexibleLayout && flexibleLayoutInstanceIndex !== null) {
        // Repeater inside flexible content
        // Pattern: ...][layout_name][repeater_key][row_id][field_key]
        // We know the layout name, so we can match after it
        // Escape the layout name for regex
        const escapedLayout = flexibleLayout.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Row ID can be alphanumeric (like instance IDs)
        const layoutPattern = `\\]\\[${escapedLayout}\\]\\[([^\\]]+)\\]\\[([^\\]]+)\\]\\[([^\\]]+)\\]$`;
        const nestedRepeaterMatch = inputName.match(new RegExp(layoutPattern));
        if (nestedRepeaterMatch) {
          const potentialRepeaterKey = nestedRepeaterMatch[1];
          const rowIdStr = nestedRepeaterMatch[2];
          // Try to parse as number if numeric, otherwise keep as string
          const numericRowIndex = parseInt(rowIdStr, 10);
          const potentialRowIndex = !isNaN(numericRowIndex) && rowIdStr === numericRowIndex.toString()
            ? numericRowIndex
            : rowIdStr;
          // Verify by checking if we found a repeater element
          if (repeaterKey && potentialRepeaterKey === repeaterKey) {
            repeaterRowIndex = potentialRowIndex;
          } else if (!repeaterKey) {
            // Use the extracted key if we don't have one from DOM
            repeaterKey = potentialRepeaterKey;
            repeaterRowIndex = potentialRowIndex;
          }
        }
      } else {
        // Top-level repeater (not inside flexible content)
        // Pattern: acf[field_group][repeater_key][row_id][field_key]
        // Row ID can be alphanumeric
        const repeaterMatch = inputName.match(/acf\[[^\]]+\]\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]/);
        if (repeaterMatch) {
          const extractedRepeaterKey = repeaterMatch[1];
          const rowIdStr = repeaterMatch[2];
          // Try to parse as number if numeric, otherwise keep as string
          const numericRowIndex = parseInt(rowIdStr, 10);
          const extractedRowIndex = !isNaN(numericRowIndex) && rowIdStr === numericRowIndex.toString()
            ? numericRowIndex
            : rowIdStr;
          // Verify this is actually a repeater (not a flexible content pattern)
          // If we have a repeater element, use its key; otherwise use extracted
          if (repeaterKey && extractedRepeaterKey === repeaterKey) {
            repeaterRowIndex = extractedRowIndex;
          } else if (!repeaterKey) {
            repeaterKey = extractedRepeaterKey;
            repeaterRowIndex = extractedRowIndex;
          }
        }
      }
    }
  }

  const context = {
    fieldGroupKey,
    flexibleLayout,
    flexibleLayoutInstanceIndex,
    flexibleContentFieldKey,
    repeaterKey,
    repeaterRowIndex,
  };

  // Debug logging
  if (typeof window !== 'undefined' && (window as any).__ACFOI_DEBUG__) {
    console.log('[ACFOI] getFieldContext:', {
      instanceId,
      inputName,
      inputNameFull: inputName, // Show full name for debugging
      flexibleLayoutEl: flexibleLayoutEl ? {
        layout: flexibleLayoutEl.dataset.layout,
        html: flexibleLayoutEl.outerHTML.substring(0, 200),
      } : null,
      context,
    });
  }

  return context;
}

// Generate storage key for last color based on context
function getLastColorStorageKey(
  fieldGroupKey: string,
  flexibleContentFieldKey: string | null,
  flexibleLayout: string | null,
  flexibleLayoutInstanceIndex: string | number | null,
  repeaterKey: string | null,
  repeaterRowIndex: string | number | null
): string {
  const parts = ['acfoi_last_color', fieldGroupKey];

  // Include flexible content context if present
  if (flexibleContentFieldKey && flexibleLayout) {
    parts.push('flex', flexibleContentFieldKey, flexibleLayout);
    // Include instance index/ID to isolate each layout instance
    if (flexibleLayoutInstanceIndex !== null) {
      parts.push('i', String(flexibleLayoutInstanceIndex));
    }
  }

  // Include repeater context if present
  if (repeaterKey) {
    parts.push('rep', repeaterKey);
    // Include row index/ID to isolate each repeater row
    if (repeaterRowIndex !== null) {
      parts.push('r', String(repeaterRowIndex));
    }
  }

  const key = parts.join('_');

  // Debug logging
  if (typeof window !== 'undefined' && (window as any).__ACFOI_DEBUG__) {
    console.log('[ACFOI] getLastColorStorageKey:', {
      fieldGroupKey,
      flexibleContentFieldKey,
      flexibleLayout,
      flexibleLayoutInstanceIndex,
      repeaterKey,
      repeaterRowIndex,
      generatedKey: key,
    });
  }

  return key;
}

// Get last color from localStorage
function getLastColor(
  fieldGroupKey: string,
  flexibleContentFieldKey: string | null,
  flexibleLayout: string | null,
  flexibleLayoutInstanceIndex: string | number | null,
  repeaterKey: string | null,
  repeaterRowIndex: string | number | null
): { token: string; hex: string } | null {
  try {
    const key = getLastColorStorageKey(
      fieldGroupKey,
      flexibleContentFieldKey,
      flexibleLayout,
      flexibleLayoutInstanceIndex,
      repeaterKey,
      repeaterRowIndex
    );
    const stored = localStorage.getItem(key);

    // Debug logging
    if (typeof window !== 'undefined' && (window as any).__ACFOI_DEBUG__) {
      console.log('[ACFOI] getLastColor:', {
        lookupKey: key,
        found: !!stored,
        storedValue: stored ? JSON.parse(stored) : null,
      });
    }

    if (stored) {
      const storedColor = JSON.parse(stored);
      // Always resolve hex from current palette to ensure we use current color values
      // The stored hex might be outdated if palette colors changed
      const palette: { token: string; hex: string }[] = (window as any).__ACFOIL_PALETTE__?.items || [];
      const currentPaletteItem = palette.find((p) => p.token === storedColor.token);
      if (currentPaletteItem) {
        return {
          token: storedColor.token,
          hex: currentPaletteItem.hex, // Use current palette color, not stored hex
        };
      }
      // Fallback to stored hex if token not found in current palette
      return storedColor;
    }
  } catch (e) {
    if (typeof window !== 'undefined' && (window as any).__ACFOI_DEBUG__) {
      console.error('[ACFOI] getLastColor error:', e);
    }
  }
  return null;
}

// Save last color to localStorage
function saveLastColor(
  fieldGroupKey: string,
  flexibleContentFieldKey: string | null,
  flexibleLayout: string | null,
  flexibleLayoutInstanceIndex: string | number | null,
  repeaterKey: string | null,
  repeaterRowIndex: string | number | null,
  color: { token: string; hex: string }
): void {
  try {
    const key = getLastColorStorageKey(
      fieldGroupKey,
      flexibleContentFieldKey,
      flexibleLayout,
      flexibleLayoutInstanceIndex,
      repeaterKey,
      repeaterRowIndex
    );

    // Debug logging
    if (typeof window !== 'undefined' && (window as any).__ACFOI_DEBUG__) {
      console.log('[ACFOI] saveLastColor:', {
        storageKey: key,
        color,
      });
    }

    localStorage.setItem(key, JSON.stringify(color));
  } catch (e) {
    if (typeof window !== 'undefined' && (window as any).__ACFOI_DEBUG__) {
      console.error('[ACFOI] saveLastColor error:', e);
    }
  }
}

/**
 * Apply color to SVG, detecting whether to use fill or stroke (or both).
 * Matches the PHP backend logic for consistency.
 */
function applyColorToSvg(svg: string, color: string): string {
  if (!svg || !color) return svg;

  // Detect if icon uses fill or stroke (or both)
  // Some icon sets (e.g., Heroicons solid) use fill, others use stroke
  const hasStroke = /\bstroke(?!-)\s*=/i.test(svg);
  const hasFill = /\bfill(?!-)\s*=/i.test(svg) && !/fill\s*=\s*["']none["']/i.test(svg);

  let result = svg;

  // Apply color to stroke if present
  if (hasStroke) {
    // Use negative lookahead to avoid matching stroke-width, stroke-linecap, etc.
    result = result.replace(/\bstroke(?!-)\s*=\s*["']?[^"'\s>]*["']?/gi, `stroke="${color}"`);
  }

  // Apply color to fill if present and not explicitly set to "none"
  if (hasFill) {
    // Use negative lookahead to avoid matching fill-opacity, fill-rule, etc.
    result = result.replace(/\bfill(?!-)\s*=\s*["']?[^"'\s>]*["']?/gi, `fill="${color}"`);
  }

  return result;
}

/**
 * Normalize SVG to base form (remove color, set to currentColor).
 * Used when storing base SVG in cache.
 */
function normalizeSvgToBase(svg: string): string {
  if (!svg) return svg;

  // Detect if icon uses fill or stroke
  const hasStroke = /\bstroke(?!-)\s*=/i.test(svg);
  const hasFill = /\bfill(?!-)\s*=/i.test(svg) && !/fill\s*=\s*["']none["']/i.test(svg);

  let result = svg;

  // Normalize stroke to currentColor if present
  if (hasStroke) {
    result = result.replace(/\bstroke(?!-)\s*=\s*["']?[^"'\s>]*["']?/gi, 'stroke="currentColor"');
  }

  // Normalize fill to currentColor if present (and not none)
  if (hasFill) {
    result = result.replace(/\bfill(?!-)\s*=\s*["']?[^"'\s>]*["']?/gi, 'fill="currentColor"');
  }

  return result;
}

export default function IconPicker({
  provider,
  version,
  onSelect,
  instanceId,
  useLastColor = false,
  fieldKey = '',
  fieldGroupKey = '',
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  disableColorPicker = false,
}: {
  provider: string;
  version: string;
  onSelect: (item: IconItem) => void;
  instanceId?: string;
  useLastColor?: boolean;
  fieldKey?: string;
  fieldGroupKey?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disableColorPicker?: boolean;
}) {
  const restBase = useRestBase();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;
  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const palette: { token: string; label?: string; hex: string }[] =
    (window as any).__ACFOIL_PALETTE__?.items || [];
  const defaultToken: string =
    (window as any).__ACFOIL_PALETTE__?.default || 'A';
  const defaultHex =
    palette.find((i) => i.token === defaultToken)?.hex || '#111111';
  const libraryInfo: { url: string; name: string } = (window as any)
    .__ACFOIL_LIBRARY__ || { url: 'https://lucide.dev/icons', name: 'Lucide' };

  // Initialize color state - check for last color synchronously to avoid flash
  // Use function initializer to check synchronously on each mount
  const getInitialColor = (): { color: string; token: string } => {
    if (!instanceId) {
      return { color: defaultHex, token: defaultToken };
    }

    // First, check if current icon has a color
    const field = document.querySelector(
      `.acfoi-field[data-acfoi-instance-id="${instanceId}"]`
    ) as HTMLElement | null;
    if (field) {
      const colorTokenInput = field.querySelector(
        '[data-acfoi-color-token-out]'
      ) as HTMLInputElement | null;
      if (colorTokenInput?.value) {
        const token = colorTokenInput.value;
        const matchingPalette = palette.find((p) => p.token === token);
        if (matchingPalette) {
          return { color: matchingPalette.hex, token };
        }
      }
    }

    // If "Use Last Color" is enabled, check for last color
    if (useLastColor) {
      const context = getFieldContext(instanceId);
      const lastColor = getLastColor(
        context.fieldGroupKey || fieldGroupKey,
        context.flexibleContentFieldKey,
        context.flexibleLayout,
        context.flexibleLayoutInstanceIndex,
        context.repeaterKey,
        context.repeaterRowIndex
      );
      if (lastColor) {
        return { color: lastColor.hex, token: lastColor.token };
      }
    }

    // Fallback to default
    return { color: defaultHex, token: defaultToken };
  };

  const [currentColor, setCurrentColor] = React.useState<string>(() => getInitialColor().color);
  const [currentToken, setCurrentToken] = React.useState<string>(() => getInitialColor().token);
  const [all, setAll] = React.useState<string[]>([]);
  const [cache, setCache] = React.useState<Record<string, string>>({});
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [manifestLoading, setManifestLoading] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 50 });
  const { recent, addRecent } = useRecentIcons(provider, version, open);
  // Track current icon from the field (read from DOM when modal opens)
  const [currentIconKey, setCurrentIconKey] = React.useState<string | null>(null);

  // Performance tracking refs
  const filterStartTimeRef = React.useRef<number | null>(null);
  const skeletonRemovalTimesRef = React.useRef<Map<string, number>>(new Map());
  const modalOpenTimeRef = React.useRef<number | null>(null);
  const pendingFetchKeysRef = React.useRef<Set<string>>(new Set());
  // Track if activeIdx change was from keyboard (to avoid scrolling on mouse hover)
  const activeIdxFromKeyboardRef = React.useRef<boolean>(false);

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== debouncedQuery) {
        filterStartTimeRef.current = performance.now();
      }
      setDebouncedQuery(query);
      setActiveIdx(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, debouncedQuery]);

  // Track if we've initialized the color from last color (to prevent overriding user changes)
  const colorInitializedRef = React.useRef(false);

  // Read current icon from DOM when modal opens
  React.useEffect(() => {
    if (open && instanceId) {
      // Find the field element by instance ID
      const field = document.querySelector(
        `.acfoi-field[data-acfoi-instance-id="${instanceId}"]`
      ) as HTMLElement | null;
      if (field) {
        const keyInput = field.querySelector(
          '[data-acfoi-key-out]'
        ) as HTMLInputElement | null;
        const currentKey = keyInput?.value?.trim() || null;
        setCurrentIconKey(currentKey);

        // Load current icon into cache if not already loaded
        if (currentKey && !cache[currentKey]) {
          const svgInput = field.querySelector(
            '[data-acfoi-svg-out]'
          ) as HTMLTextAreaElement | null;
          if (svgInput?.value) {
            // Extract the base SVG (without color) by normalizing to currentColor
            const baseSvg = normalizeSvgToBase(svgInput.value);
            setCache((prev) => ({ ...prev, [currentKey]: baseSvg }));
          }
        }

        // Sync the color picker - only on initial open, don't override user changes
        const colorTokenInput = field.querySelector(
          '[data-acfoi-color-token-out]'
        ) as HTMLInputElement | null;
        if (colorTokenInput?.value) {
          // If icon already has a color, use it (only if we haven't initialized yet)
          if (!colorInitializedRef.current) {
            const token = colorTokenInput.value;
            const matchingPalette = palette.find((p) => p.token === token);
            if (matchingPalette) {
              setCurrentToken(token);
              setCurrentColor(matchingPalette.hex);
              colorInitializedRef.current = true;
            }
          }
        } else if (useLastColor && !colorInitializedRef.current) {
          // If "Use Last Color" is enabled and no color is set, use last color as DEFAULT
          // Only set it once on initial open, don't force it if user changes it
          const context = getFieldContext(instanceId);
          const lastColor = getLastColor(
            context.fieldGroupKey || fieldGroupKey,
            context.flexibleContentFieldKey,
            context.flexibleLayout,
            context.flexibleLayoutInstanceIndex,
            context.repeaterKey,
            context.repeaterRowIndex
          );
          if (lastColor) {
            setCurrentToken(lastColor.token);
            setCurrentColor(lastColor.hex);
            colorInitializedRef.current = true;
          }
        }
      }
    } else {
      setCurrentIconKey(null);
      // Reset initialization flag when modal closes
      colorInitializedRef.current = false;
    }
  }, [open, instanceId, palette, useLastColor, fieldGroupKey, cache]);

  // Fetch current icon SVG if not in cache (after ensureSvg is defined)
  React.useEffect(() => {
    if (open && currentIconKey && !cache[currentIconKey] && restBase) {
      const url = `${restBase}/acf-open-icons-lite/v1/icon?provider=${encodeURIComponent(
        provider
      )}&version=${encodeURIComponent(version)}&key=${encodeURIComponent(currentIconKey)}`;
      fetch(url)
        .then((r) => {
          if (!r.ok) {
            return null;
          }
          return r.text();
        })
        .then((svg) => {
          if (!svg) {
            return;
          }
          // Store base SVG (without color) - normalize to currentColor
          const baseSvg = normalizeSvgToBase(svg);
          setCache((prev) => ({ ...prev, [currentIconKey]: baseSvg }));
        })
        .catch(() => {});
    }
  }, [open, currentIconKey, cache, provider, version, restBase]);

  // Reset query when modal closes
  React.useEffect(() => {
    if (open) {
      modalOpenTimeRef.current = performance.now();
    } else {
      setQuery('');
      setDebouncedQuery('');
      setActiveIdx(0);
      if (modalOpenTimeRef.current) {
        modalOpenTimeRef.current = null;
      }
    }
  }, [open]);

  // Hydrate cache from sessionStorage for this provider/version
  React.useEffect(() => {
    try {
      const key = `acfoi_cache_${provider}@${version}`;
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const obj = JSON.parse(raw) as Record<string, string>;
        if (obj && typeof obj === 'object') setCache(obj);
      }
    } catch {}
  }, [provider, version]);

  // Persist cache to sessionStorage (throttled)
  React.useEffect(() => {
    const id = setTimeout(() => {
      try {
        const key = `acfoi_cache_${provider}@${version}`;
        sessionStorage.setItem(key, JSON.stringify(cache));
      } catch {}
    }, 250);
    return () => clearTimeout(id);
  }, [cache, provider, version]);

  // load manifest once
  React.useEffect(() => {
    let mounted = true;
    setManifestLoading(true);
    async function load() {
      const url = `${restBase}/acf-open-icons-lite/v1/manifest?provider=${encodeURIComponent(
        provider
      )}&version=${encodeURIComponent(version)}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (mounted) setManifestLoading(false);
        return;
      }
      const data = await res.json();
      if (mounted) {
        // Deduplicate icons array to prevent duplicate key warnings
        const icons = data.icons || [];
        const uniqueIcons = Array.from(new Set(icons));
        setAll(uniqueIcons);
        setManifestLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [provider, version, restBase]);

  // Eagerly load first 24 icons when modal opens (for immediate display)
  React.useEffect(() => {
    if (!open || all.length === 0) return;
    const keysToEagerLoad = all.slice(0, 24).filter((k) => !cache[k]);
    if (keysToEagerLoad.length === 0) return;
    const url = `${restBase}/acf-open-icons-lite/v1/bundle?provider=${encodeURIComponent(
      provider
    )}&version=${encodeURIComponent(version)}&keys=${keysToEagerLoad.join(',')}`;
      fetch(url)
        .then((r) => {
          if (!r.ok) {
            return { items: [] };
          }
          return r.json();
        })
        .then((data) => {
          const next: Record<string, string> = {};
          for (const it of data.items || []) next[it.key] = it.svg;
          setCache((prev) => ({ ...next, ...prev }));
        })
        .catch(() => {});
  }, [open, all, cache, provider, version, restBase]);

  // Warm recent icons when modal opens
  React.useEffect(() => {
    if (!open || recent.length === 0) return;
    const missing = recent.filter((k) => !cache[k]);
    if (missing.length === 0) return;
    const url = `${restBase}/acf-open-icons-lite/v1/bundle?provider=${encodeURIComponent(
      provider
    )}&version=${encodeURIComponent(version)}&keys=${missing.join(',')}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) {
          return { items: [] };
        }
        return r.json();
      })
      .then((data) => {
        const next: Record<string, string> = {};
        for (const it of data.items || []) {
          next[it.key] = it.svg;
        }
        setCache((prev) => ({ ...next, ...prev }));
      })
      .catch(() => {});
  }, [open, recent, cache, provider, version, restBase]);

  // Prewarm first 24 icons on external event without opening
  React.useEffect(() => {
    function onPrewarm() {
      if (all.length === 0) return;
      const keys = all.slice(0, 24).filter((k) => !cache[k]);
      if (!keys.length) return;
      const url = `${restBase}/acf-open-icons-lite/v1/bundle?provider=${encodeURIComponent(
        provider
      )}&version=${encodeURIComponent(version)}&keys=${keys.join(',')}`;
      fetch(url)
        .then((r) => {
          if (!r.ok) {
            return { items: [] };
          }
          return r.json();
        })
        .then((data) => {
          const next: Record<string, string> = {};
          for (const it of data.items || []) next[it.key] = it.svg;
          if (Object.keys(next).length)
            setCache((prev) => ({ ...next, ...prev }));
        })
        .catch(() => {});
    }
    window.addEventListener('acfoi-prewarm', onPrewarm);
    return () => window.removeEventListener('acfoi-prewarm', onPrewarm);
  }, [provider, version, restBase, all, cache]);

  const list = React.useMemo(() => {
    const startTime = performance.now();

    // Always use all icons, filter by query if provided
    const lowerQuery = debouncedQuery ? debouncedQuery.toLowerCase() : '';
    const filtered = lowerQuery
      ? (all || []).filter((k) => k.toLowerCase().includes(lowerQuery))
      : all || [];

    // Deduplicate to prevent duplicate key warnings
    const uniqueFiltered = Array.from(new Set(filtered));

    if (filterStartTimeRef.current) {
      filterStartTimeRef.current = null;
    }

    return uniqueFiltered;
  }, [all, debouncedQuery]);

  // Separate recent icons from main list
  const recentInList = React.useMemo(() => {
    if (debouncedQuery) return []; // Don't show recent when searching
    // Optimize: use Set for O(1) lookup instead of O(n) includes()
    const allSet = new Set(all);
    return recent.filter((key) => allSet.has(key));
  }, [recent, all, debouncedQuery]);

  const mainList = React.useMemo(() => {
    if (debouncedQuery) return list; // Show all search results
    // Optimize: use Set for O(1) lookup instead of O(n) includes()
    const recentSet = new Set(recent);
    const filtered = list.filter((key) => !recentSet.has(key));
    return filtered; // Show all icons (virtual scrolling handles performance)
  }, [list, recent, debouncedQuery]);

  // Virtual scrolling: track visible items using Intersection Observer
  React.useEffect(() => {
    if (!open || !gridRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(
              entry.target.getAttribute('data-index') || '0'
            );
            setVisibleRange((prev) => ({
              start: Math.min(prev.start, idx),
              end: Math.max(prev.end, idx + 20), // Load 20 items ahead
            }));
          }
        });
      },
      {
        root: gridRef.current,
        rootMargin: '200px', // Start loading before item is visible
        threshold: 0,
      }
    );

    const items = gridRef.current.querySelectorAll('[data-index]');
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [open, mainList, recentInList]);

  // Fetch bundle for search results and visible items
  React.useEffect(() => {
    if (!open || list.length === 0) return;
    // When searching, fetch visible items first, then background items
    // When not searching, only fetch visible items for performance
    const fetchStartTime = performance.now();

    const keysToFetch = debouncedQuery
      ? mainList.slice(0, 48).filter((k) => !cache[k]) // Only fetch first 48 visible items when searching
      : [
          ...recentInList.filter((k) => !cache[k]),
          ...mainList
            .slice(visibleRange.start, visibleRange.end)
            .filter((k) => !cache[k]),
        ];

    if (keysToFetch.length === 0) return;

    // Track when items start loading (for skeleton removal timing)
    const visibleKeys = debouncedQuery
      ? mainList.slice(0, 48) // First visible items in search (6x8 grid = 48)
      : [
          ...recentInList.slice(0, 8),
          ...mainList.slice(
            visibleRange.start,
            Math.min(visibleRange.end, visibleRange.start + 40)
          ),
        ];

    visibleKeys.forEach((key) => {
      if (!cache[key] && !skeletonRemovalTimesRef.current.has(key)) {
        skeletonRemovalTimesRef.current.set(key, fetchStartTime);
      }
    });

    // Split into chunks of 200 for parallel fetching
    const chunkSize = 200;
    const chunks: string[][] = [];
    for (let i = 0; i < keysToFetch.length; i += chunkSize) {
      chunks.push(keysToFetch.slice(i, i + chunkSize));
    }

    // Fetch all chunks in parallel
    const fetchPromises = chunks.map((chunk) => {
      const url = `${restBase}/acf-open-icons-lite/v1/bundle?provider=${encodeURIComponent(
        provider
      )}&version=${encodeURIComponent(version)}&keys=${chunk.join(',')}`;
      return fetch(url)
        .then((r) => {
          if (!r.ok) {
            return { items: [] };
          }
          return r.json();
        })
        .then((data) => {
          const next: Record<string, string> = {};
          for (const it of data.items || []) {
            next[it.key] = it.svg;
          }
          return next;
        })
        .catch(() => {
          return {};
        });
    });

    Promise.all(fetchPromises).then((results) => {
      const fetchEndTime = performance.now();
      const fetchDuration = fetchEndTime - fetchStartTime;

      const merged: Record<string, string> = {};
      for (const result of results) {
        Object.assign(merged, result);
      }

      if (Object.keys(merged).length > 0) {
        // Measure skeleton removal time for visible items
        const visibleFetched = visibleKeys.filter((key) => merged[key]);
        if (visibleFetched.length > 0) {
          const removalTimes: number[] = [];
          visibleFetched.forEach((key) => {
            const startTime = skeletonRemovalTimesRef.current.get(key);
            if (startTime) {
              skeletonRemovalTimesRef.current.delete(key);
              removalTimes.push(performance.now() - startTime);
            }
          });
        }

        setCache((prev) => ({ ...prev, ...merged }));

        // When searching, fetch remaining results in background after visible ones load
        if (debouncedQuery && mainList.length > 48) {
          const remaining = mainList
            .slice(48)
            .filter((k) => !cache[k] && !merged[k])
            .slice(0, 500); // Fetch up to 500 background items (reasonable batch size)

          if (remaining.length > 0) {
            setTimeout(() => {
              const bgStart = performance.now();
              const bgChunks: string[][] = [];
              for (let i = 0; i < remaining.length; i += 200) {
                bgChunks.push(remaining.slice(i, i + 200));
              }

              Promise.all(
                bgChunks.map((chunk) => {
                  const url = `${restBase}/acf-open-icons-lite/v1/bundle?provider=${encodeURIComponent(
                    provider
                  )}&version=${encodeURIComponent(version)}&keys=${chunk.join(
                    ','
                  )}`;
                  return fetch(url)
                    .then((r) => {
                      if (!r.ok) {
                        return { items: [] };
                      }
                      return r.json();
                    })
                    .then((data) => {
                      const next: Record<string, string> = {};
                      for (const it of data.items || []) {
                        next[it.key] = it.svg;
                      }
                      return next;
                    })
                    .catch(() => {
                      return {};
                    });
                })
              ).then((bgResults) => {
                const bgMerged: Record<string, string> = {};
                for (const result of bgResults) {
                  Object.assign(bgMerged, result);
                }
                if (Object.keys(bgMerged).length > 0) {
                  setCache((prev) => ({ ...prev, ...bgMerged }));
                }
              });
            }, 200); // Small delay to prioritize visible items
          }
        }
      }
    });
  }, [
    open,
    list,
    cache,
    provider,
    version,
    restBase,
    visibleRange,
    recentInList,
    mainList,
    debouncedQuery,
  ]);

  React.useEffect(() => {
    if (!open) return;
    setActiveIdx(0);
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      const totalItems = recentInList.length + mainList.length;
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIdxFromKeyboardRef.current = true;
        setActiveIdx((i) => Math.min(i + 1, Math.max(0, totalItems - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIdxFromKeyboardRef.current = true;
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const flatList = [...recentInList, ...mainList];
        const key = flatList[activeIdx];
        if (key) pick(key);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, mainList, recentInList, activeIdx]);

  // Scroll active item into view (only for keyboard navigation, not mouse hover)
  React.useEffect(() => {
    if (!open || activeIdx < 0) return;

    // Only scroll if the change was from keyboard navigation
    if (!activeIdxFromKeyboardRef.current) {
      return;
    }

    // Reset the flag after checking
    activeIdxFromKeyboardRef.current = false;

    const flatList = [...recentInList, ...mainList];
    const total = flatList.length;
    if (activeIdx >= total) return;

    const item = gridRef.current?.querySelector(
      `[data-index="${activeIdx}"]`
    ) as HTMLElement;
    if (item) {
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeIdx, open, mainList, recentInList]);

  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  async function ensureSvg(key: string) {
    if (cache[key]) return cache[key];
    const url = `${restBase}/acf-open-icons-lite/v1/icon?provider=${encodeURIComponent(
      provider
    )}&version=${encodeURIComponent(version)}&key=${encodeURIComponent(key)}`;
    const res = await fetch(url);
    let svg = await res.text();
    // Apply chosen color to SVG - detects fill or stroke (or both)
    svg = applyColorToSvg(svg, currentColor);
    setCache((prev) => ({ ...prev, [key]: svg }));
    return svg;
  }

  async function pick(key: string) {
    // Call onSelect immediately with cached SVG if available (non-blocking)
    const cachedSvg = cache[key];

    addRecent(key);
    const color = { token: currentToken, hex: currentColor };

    // Close modal FIRST (before calling onSelect) to ensure immediate visual feedback
    // Use flushSync to force immediate React update and visual close
    flushSync(() => {
      setOpen(false);
    });

    // Call onSelect immediately after modal is closed (don't wait for next frame)
    onSelect({ key, svg: cachedSvg, color });

    // Fetch SVG in background if not cached (for preview purposes)
    if (!cachedSvg) {
      ensureSvg(key).then((svg) => {
        // Update callback if needed, but don't block UI
        onSelect({ key, svg, color });
      }).catch(() => {
        // Background SVG fetch failed
      });
    }

    // Save last color if "Use Last Color" is enabled
    if (useLastColor && instanceId) {
      const context = getFieldContext(instanceId);
      saveLastColor(
        context.fieldGroupKey || fieldGroupKey,
        context.flexibleContentFieldKey,
        context.flexibleLayout,
        context.flexibleLayoutInstanceIndex,
        context.repeaterKey,
        context.repeaterRowIndex,
        color
      );
    }
  }

  // Apply color to current icon and close modal
  async function applyColorToCurrentIcon() {
    if (!currentIconKey) return;
    const svg = await ensureSvg(currentIconKey);
    const color = { token: currentToken, hex: currentColor };
    onSelect({ key: currentIconKey, svg, color });

    // Save last color if "Use Last Color" is enabled
    if (useLastColor && instanceId) {
      const context = getFieldContext(instanceId);
      saveLastColor(
        context.fieldGroupKey || fieldGroupKey,
        context.flexibleContentFieldKey,
        context.flexibleLayout,
        context.flexibleLayoutInstanceIndex,
        context.repeaterKey,
        context.repeaterRowIndex,
        color
      );
    }

    setOpen(false); // Close modal after applying
  }

  // Listen for open button clicks - only open if this instance matches (skip if controlled)
  React.useEffect(() => {
    if (isControlled) return; // Skip event listener if controlled externally

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ instanceId?: string }>;
      const eventInstanceId = customEvent.detail?.instanceId;
      const shouldOpen = !instanceId || eventInstanceId === instanceId;

      if (shouldOpen) {
        // Before opening, check and update color synchronously to avoid flash
        if (instanceId) {
          const field = document.querySelector(
            `.acfoi-field[data-acfoi-instance-id="${instanceId}"]`
          ) as HTMLElement | null;
          if (field) {
            const colorTokenInput = field.querySelector(
              '[data-acfoi-color-token-out]'
            ) as HTMLInputElement | null;
            if (colorTokenInput?.value) {
              const token = colorTokenInput.value;
              const matchingPalette = palette.find((p) => p.token === token);
              if (matchingPalette) {
                setCurrentToken(token);
                setCurrentColor(matchingPalette.hex);
              }
            } else if (useLastColor) {
              const context = getFieldContext(instanceId);
              const lastColor = getLastColor(
                context.fieldGroupKey || fieldGroupKey,
                context.flexibleContentFieldKey,
                context.flexibleLayout,
                context.flexibleLayoutInstanceIndex,
                context.repeaterKey,
                context.repeaterRowIndex
              );
              if (lastColor) {
                setCurrentToken(lastColor.token);
                setCurrentColor(lastColor.hex);
              }
            }
          }
        }
        setOpen(true);
      }
    };
    window.addEventListener('acfoi-open-modal', handler);
    return () => window.removeEventListener('acfoi-open-modal', handler);
  }, [instanceId, useLastColor, fieldGroupKey, palette, isControlled]);

  // Simple luminance to detect overly light colors
  function isLight(hex: string): boolean {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum > 0.92; // near-white
  }

  const flatList = [...recentInList, ...mainList];
  const totalCount = all.length;
  const showingCount = flatList.length;
  const hasMore = showingCount < totalCount;

  // Render icon button
  const renderIconButton = (key: string, idx: number, isRecent = false) => {
    const svgRaw = cache[key];
    const svgColored = svgRaw
      ? applyColorToSvg(svgRaw, currentColor)
      : '';
    const isActive = idx === activeIdx;

    return (
      <button
        key={`${isRecent ? 'recent-' : 'main-'}${key}-${idx}`}
        data-index={idx}
        aria-label={`Select icon: ${key}`}
        type='button'
        className={`group flex flex-col aspect-square items-center border rounded-lg p-3 transition-all duration-200 hover:bg-accent hover:border-primary/30 hover:scale-[1.02] hover:shadow-sm cursor-pointer ${
          isActive
            ? 'ring-2 ring-primary ring-offset-1 bg-primary/5 border-primary/50 shadow-sm'
            : 'border-zinc-200'
        } ${isLight(currentColor) ? 'bg-zinc-600 text-white' : ''}`}
        onMouseEnter={() => setActiveIdx(idx)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          pick(key);
        }}
      >
        <div className='flex-1 flex items-center justify-center'>
          {svgColored ? (
            <div
              className='w-7 h-7 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full flex-shrink-0'
              dangerouslySetInnerHTML={{ __html: svgColored }}
            />
          ) : (
            <IconSkeleton />
          )}
        </div>
        <div
          className='text-xs text-center leading-tight px-1 truncate w-full'
          title={key}
        >
          {key}
        </div>
      </button>
    );
  };

  return (
    <DialogContent
      open={open}
      onOpenChange={setOpen}
      className='max-w-[900px] lg:max-w-[1000px] xl:max-w-[1200px]'
    >
      <DialogHeader>
        <div className='flex items-center justify-between'>
          <DialogTitle>Select Icon</DialogTitle>
          <button
            type='button'
            onClick={() => setOpen(false)}
            className='rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer'
            aria-label='Close dialog'
          >
            <svg
              width='20'
              height='20'
              viewBox='0 0 20 20'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M15 5L5 15M5 5l10 10' />
            </svg>
          </button>
        </div>
      </DialogHeader>

      {/* Current Icon Preview (if icon is already selected) */}
      {currentIconKey && (
        <div className='mb-4 px-2 py-3 bg-zinc-50 border border-zinc-200 rounded-lg'>
          <div className='flex items-center gap-3'>
            <div className='flex-shrink-0'>
              {cache[currentIconKey] ? (
                <div
                  className='w-10 h-10 flex items-center justify-center border border-zinc-300 rounded bg-white [&>svg]:w-6 [&>svg]:h-6'
                  dangerouslySetInnerHTML={{
                    __html: cache[currentIconKey].replace(
                      /stroke="[^"]*"/g,
                      `stroke="${currentColor}"`
                    ),
                  }}
                />
              ) : (
                <div className='w-10 h-10 flex items-center justify-center border border-zinc-300 rounded bg-white'>
                  <div className='w-6 h-6 bg-zinc-200 rounded animate-pulse' />
                </div>
              )}
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-sm font-medium text-zinc-900 truncate'>
                Current Icon: {currentIconKey}
              </div>
              <div className='text-xs text-zinc-500'>
                {cache[currentIconKey] ? 'Preview with selected color' : 'Loading icon...'}
              </div>
            </div>
            <button
              type='button'
              onClick={applyColorToCurrentIcon}
              disabled={!cache[currentIconKey]}
              className='px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600'
            >
              Apply & Close
            </button>
          </div>
        </div>
      )}

      <div className='relative mb-4 px-2'>
        <div className='flex items-center gap-3 mb-2'>
          <div className='relative flex-1'>
            <Input
              ref={inputRef}
              placeholder='Search icons…'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className='pr-10'
              name='icon-search'
            />
            {query && (
              <button
                type='button'
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className='absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-1'
                aria-label='Clear search'
              >
                <svg
                  width='16'
                  height='16'
                  viewBox='0 0 16 16'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                >
                  <path d='M12 4l-8 8M4 4l8 8' />
                </svg>
              </button>
            )}
          </div>
          {!disableColorPicker && (
            <SelectMenu
              className='w-[180px] shrink-0'
              items={(palette.length
                ? palette
                : [{ token: 'A', label: 'Primary', hex: currentColor }]
              ).map((p) => ({
                value: p.token,
                label: p.label || p.token,
                hex: p.hex,
              }))}
              value={currentToken}
              onChange={(val) => {
                setCurrentToken(val);
                const hex =
                  palette.find((p) => p.token === val)?.hex || currentColor;
                setCurrentColor(hex);
              }}
            />
          )}
        </div>
        {/* Results counter */}
        {(query || list.length > 0) && (
          <div className='text-xs text-muted-foreground px-1 mb-2'>
            {debouncedQuery ? (
              <>
                Showing <strong>{showingCount}</strong>
                {hasMore && ` of ${totalCount}`} icon
                {showingCount !== 1 ? 's' : ''}
                {hasMore && ` (showing first ${showingCount})`}
              </>
            ) : (
              <>
                <strong>{totalCount}</strong> icon{totalCount !== 1 ? 's' : ''}{' '}
                available
                {recentInList.length > 0 && (
                  <>
                    {' '}
                    • <strong>{recentInList.length}</strong> recent
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div>
        <div
          ref={gridRef}
          className='max-h-[500px] overflow-auto min-h-[400px]'
        >
          {!debouncedQuery && recentInList.length > 0 && (
            <div className='mb-6'>
              <h3 className='text-sm font-semibold text-zinc-700 mb-3 px-2'>
                Recently Used
              </h3>
              <div className='grid grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3 py-2 px-2'>
                {recentInList.map((key, idx) =>
                  renderIconButton(key, idx, true)
                )}
              </div>
            </div>
          )}

          {mainList.length > 0 && (
            <div>
              {!debouncedQuery && recentInList.length > 0 && (
                <h3 className='text-sm font-semibold text-zinc-700 mb-3 px-2'>
                  All Icons
                </h3>
              )}
              <div className='grid grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3 py-2 px-2'>
                {mainList.map((key, idx) =>
                  renderIconButton(key, recentInList.length + idx, false)
                )}
              </div>
            </div>
          )}

          {manifestLoading && (
            <div className='py-16 text-center'>
              <svg
                className='w-16 h-16 mx-auto text-zinc-300 mb-4 animate-pulse'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='1.5'
                  d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
                />
              </svg>
              <div className='text-sm font-medium text-zinc-700 mb-1'>
                Loading icons...
              </div>
              <div className='text-xs text-muted-foreground'>
                Please wait while we fetch the icon library
              </div>
            </div>
          )}

          {!manifestLoading && list.length === 0 && !debouncedQuery && (
            <div className='py-16 text-center'>
              <svg
                className='w-16 h-16 mx-auto text-zinc-300 mb-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='1.5'
                  d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
                />
              </svg>
              <div className='text-sm font-medium text-zinc-700 mb-1'>
                No icons available
              </div>
              <div className='text-xs text-muted-foreground'>
                Unable to load icons from the icon library
              </div>
            </div>
          )}

          {debouncedQuery && list.length === 0 && (
            <div className='py-16 text-center'>
              <svg
                className='w-16 h-16 mx-auto text-zinc-300 mb-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='1.5'
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
              <div className='text-sm font-medium text-zinc-700 mb-1'>
                No icons found
              </div>
              <div className='text-xs text-muted-foreground'>
                Try a different search term or{' '}
                <button
                  type='button'
                  onClick={() => setQuery('')}
                  className='text-primary hover:underline'
                >
                  clear your search
                </button>
              </div>
            </div>
          )}
        </div>

        <div className='border-t mt-4 pt-4 px-2 text-xs text-muted-foreground text-center'>
          You are using <strong>{libraryInfo.name}</strong>.{' '}
          <a
            href={libraryInfo.url}
            target='_blank'
            rel='noopener noreferrer'
            className='text-blue-600 hover:underline'
          >
            View full icon set
          </a>
          .
        </div>
      </div>
    <p className="text-xs text-center text-gray-500 mt-3 pb-2">Want more icons? <a href="https://acfopenicons.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Upgrade to Pro</a> for 15,000+ icons.</p>
    </DialogContent>
  );
}
