import * as React from 'react';
import { DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { SelectMenu } from './ui/select-menu';

console.log('[ACFOI IconPicker] Component loaded');

type IconItem = { key: string; svg?: string };

function useRestBase() {
  const rest = (window as any).wpApiSettings?.root || '/wp-json/';
  return rest.replace(/\/$/, '');
}

export default function IconPicker({
  provider,
  version,
  onSelect,
  initialCommon,
}: {
  provider: string;
  version: string;
  onSelect: (item: IconItem) => void;
  initialCommon: string[];
}) {
  console.log('[ACFOI IconPicker] Rendering with provider:', provider);

  const restBase = useRestBase();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const palette: { token: string; label?: string; hex: string }[] =
    (window as any).__ACFOI_PALETTE__?.items || [];
  const defaultToken: string =
    (window as any).__ACFOI_PALETTE__?.default || 'A';
  const initialHex =
    palette.find((i) => i.token === defaultToken)?.hex || '#111111';
  const libraryInfo: { url: string; name: string } = (window as any)
    .__ACFOI_LIBRARY__ || { url: 'https://lucide.dev/icons', name: 'Lucide' };
  const [currentColour, setCurrentColour] = React.useState<string>(initialHex);
  const [currentToken, setCurrentToken] = React.useState<string>(defaultToken);
  const [all, setAll] = React.useState<string[]>([]);
  const [cache, setCache] = React.useState<Record<string, string>>({});
  const [activeIdx, setActiveIdx] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

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
    console.log('[ACFOI IconPicker] Loading manifest for', provider, version);
    let mounted = true;
    async function load() {
      const url = `${restBase}/acf-open-icons/v1/manifest?provider=${encodeURIComponent(
        provider
      )}&version=${encodeURIComponent(version)}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      console.log(
        '[ACFOI IconPicker] Manifest loaded:',
        data.icons?.length,
        'icons'
      );
      if (mounted) setAll(data.icons || []);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [provider, version]);

  // warm initial on open
  React.useEffect(() => {
    if (!open) return;
    const keys = (initialCommon || []).slice(0, 100);
    if (!keys.length) return;
    console.log('[ACFOI IconPicker] Warming common icons:', keys.length);
    const url = `${restBase}/acf-open-icons/v1/bundle?provider=${encodeURIComponent(
      provider
    )}&version=${encodeURIComponent(version)}&keys=${keys.join(',')}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const next: Record<string, string> = {};
        for (const it of data.items || []) next[it.key] = it.svg;
        setCache((prev) => ({ ...next, ...prev }));
      });
  }, [open, provider, version]);

  // Prewarm on external event without opening
  React.useEffect(() => {
    function onPrewarm() {
      const keys = (initialCommon || []).slice(0, 100).filter((k) => !cache[k]);
      if (!keys.length) return;
      const url = `${restBase}/acf-open-icons/v1/bundle?provider=${encodeURIComponent(
        provider
      )}&version=${encodeURIComponent(version)}&keys=${keys.join(',')}`;
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          const next: Record<string, string> = {};
          for (const it of data.items || []) next[it.key] = it.svg;
          if (Object.keys(next).length)
            setCache((prev) => ({ ...next, ...prev }));
        })
        .catch(() => {});
    }
    window.addEventListener('abi-prewarm', onPrewarm);
    return () => window.removeEventListener('abi-prewarm', onPrewarm);
  }, [provider, version, restBase, initialCommon, cache]);

  const list = React.useMemo(() => {
    const src = debouncedQuery
      ? all
      : initialCommon?.length
      ? initialCommon
      : all;
    console.log(
      '[ACFOI IconPicker] Filter - debouncedQuery:',
      debouncedQuery,
      'source length:',
      src?.length
    );
    const filtered = (src || []).filter(
      (k) => !debouncedQuery || k.includes(debouncedQuery)
    );
    console.log('[ACFOI IconPicker] Filtered:', filtered.length, 'icons');
    return filtered.slice(0, 200);
  }, [all, initialCommon, debouncedQuery]);

  // Fetch bundle for search results
  React.useEffect(() => {
    if (!open || !debouncedQuery || list.length === 0) return;
    const missing = list.filter((k) => !cache[k]).slice(0, 100);
    if (missing.length === 0) return;
    console.log(
      '[ACFOI IconPicker] Fetching bundle for search:',
      missing.length,
      'icons'
    );
    const url = `${restBase}/acf-open-icons/v1/bundle?provider=${encodeURIComponent(
      provider
    )}&version=${encodeURIComponent(version)}&keys=${missing.join(',')}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        console.log(
          '[ACFOI IconPicker] Bundle fetched:',
          data.items?.length,
          'icons'
        );
        const next: Record<string, string> = {};
        for (const it of data.items || []) {
          // Don't apply colour here - let the grid rendering handle it
          next[it.key] = it.svg;
        }
        setCache((prev) => ({ ...prev, ...next }));
      })
      .catch((err) =>
        console.error('[ACFOI IconPicker] Bundle fetch error:', err)
      );
  }, [open, debouncedQuery, list, cache, provider, version, restBase]);

  React.useEffect(() => {
    if (!open) return;
    setActiveIdx(0);
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, Math.max(0, list.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const key = list[activeIdx];
        if (key) pick(key);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, list, activeIdx]);

  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  async function ensureSvg(key: string) {
    if (cache[key]) return cache[key];
    console.log('[ACFOI IconPicker] Fetching SVG for:', key);
    const url = `${restBase}/acf-open-icons/v1/icon?provider=${encodeURIComponent(
      provider
    )}&version=${encodeURIComponent(version)}&key=${encodeURIComponent(key)}`;
    const res = await fetch(url);
    let svg = await res.text();
    console.log('[ACFOI IconPicker] Fetched SVG length:', svg.length, 'chars');
    // Apply chosen colour to SVG - ONLY stroke, NEVER fill (line icons)
    svg = svg.replace(/stroke="[^"]*"/g, `stroke="${currentColour}"`);
    console.log(
      '[ACFOI IconPicker] Colour applied to SVG (stroke only):',
      currentColour
    );
    setCache((prev) => ({ ...prev, [key]: svg }));
    return svg;
  }

  async function pick(key: string) {
    console.log('[ACFOI IconPicker] Picking icon:', key);
    const svg = await ensureSvg(key);
    console.log(
      '[ACFOI IconPicker] Sending selection with colour:',
      currentToken,
      currentColour
    );
    onSelect({ key, svg, colour: { token: currentToken, hex: currentColour } });
    setOpen(false);
  }

  // Listen for open button clicks
  React.useEffect(() => {
    console.log('[ACFOI IconPicker] Setting up modal listener');
    const handler = () => {
      console.log('[ACFOI IconPicker] Modal open event received');
      setOpen(true);
    };
    window.addEventListener('abi-open-modal', handler);
    return () => window.removeEventListener('abi-open-modal', handler);
  }, []);

  console.log(
    '[ACFOI IconPicker] Render open:',
    open,
    'list length:',
    list.length,
    'cache size:',
    Object.keys(cache).length
  );

  // Simple luminance to detect overly light colours
  function isLight(hex: string): boolean {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum > 0.92; // near-white
  }

  return (
    <DialogContent open={open} onOpenChange={setOpen} className='max-w-[760px]'>
      <DialogHeader>
        <DialogTitle>Select Icon</DialogTitle>
      </DialogHeader>

      <div className='relative mb-4 px-2 flex items-center gap-3'>
        <Input
          ref={inputRef}
          placeholder='Search icons…'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className='pr-20'
          name='icon-search'
        />
        <SelectMenu
          className='ml-auto w-[180px]'
          items={(palette.length
            ? palette
            : [{ token: 'A', label: 'Primary', hex: currentColour }]
          ).map((p) => ({
            value: p.token,
            label: p.label || p.token,
            hex: p.hex,
          }))}
          value={currentToken}
          onChange={(val) => {
            setCurrentToken(val);
            const hex = (
              palette.find((p) => p.token === val) || { hex: currentColour }
            ).hex;
            setCurrentColour(hex);
          }}
        />
      </div>

      <div>
        <div className='max-h-[420px] overflow-auto min-h-[420px]'>
          {!list.length && (
            <div className='py-10 text-center text-sm text-muted-foreground'>
              No icons match your search.
            </div>
          )}
          <div className='grid grid-cols-7 gap-2 py-2 px-2'>
            {list.map((key, idx) => {
              const svgRaw = cache[key];
              if (!svgRaw) {
                console.log('[ACFOI IconPicker] Missing SVG for:', key);
              }
              // Apply current colour to the SVG - ONLY stroke, NEVER fill (line icons)
              const svgColoured = svgRaw
                ? svgRaw.replace(/stroke="[^"]*"/g, `stroke="${currentColour}"`)
                : '';

              return (
                <button
                  key={key}
                  className={`flex flex-col aspect-square items-center justify-center gap-1 border rounded-md p-2 transition-colors hover:bg-accent ${
                    idx === activeIdx ? 'ring-2 ring-primary' : ''
                  } ${isLight(currentColour) ? 'bg-zinc-600 text-white' : ''}`}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => pick(key)}
                >
                  {svgColoured ? (
                    <div
                      className='w-6 h-6 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full'
                      dangerouslySetInnerHTML={{ __html: svgColoured }}
                    />
                  ) : (
                    <div className='w-6 h-6 flex items-center justify-center'>
                      <div className='w-2 h-2 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin' />
                    </div>
                  )}
                  <div className='text-[11px] leading-tight mt-2'>{key}</div>
                </button>
              );
            })}
          </div>
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
    </DialogContent>
  );
}
