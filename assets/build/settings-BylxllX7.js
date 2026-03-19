import { r as reactExports, j as jsxRuntimeExports, c as cn, a as reactDomExports, b as createRoot, R as React, B as Badge, S as SelectMenu, I as Input } from "./select-menu-DPXFltX0.js";
const Label = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "label",
    {
      ref,
      className: cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      ),
      ...props
    }
  )
);
Label.displayName = "Label";
const Button = reactExports.forwardRef(
  ({ className, variant = "primary", ...props }, ref) => {
    const base = "relative inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    const styles = variant === "secondary" ? "bg-white text-zinc-900 border hover:bg-zinc-50" : "bg-blue-600 text-white hover:bg-blue-700";
    return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: cn(base, styles, className), ref, ...props });
  }
);
Button.displayName = "Button";
const ColorPicker = reactExports.forwardRef(
  ({ className, value, onChange, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        "data-openicon-colorpicker": true,
        type: "color",
        value,
        onChange,
        ref,
        className: cn(
          "flex h-10 w-full rounded-md border border-input bg-background p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background cursor-pointer",
          className
        ),
        style: {
          WebkitAppearance: "none",
          MozAppearance: "none",
          appearance: "none"
        },
        ...props
      }
    );
  }
);
ColorPicker.displayName = "ColorPicker";
function useToaster(inlineHost) {
  const [toasts, setToasts] = reactExports.useState([]);
  const [mounted, setMounted] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setMounted(true);
  }, []);
  const remove = reactExports.useCallback((id) => {
    setToasts(
      (prev) => prev.map((t) => t.id === id ? { ...t, _removing: true } : t)
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);
  const push = reactExports.useCallback(
    (t) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setToasts((prev) => [...prev, { id, ...t }]);
      setTimeout(() => remove(id), 5e3);
    },
    [remove]
  );
  if (!mounted) {
    return { push, portal: null };
  }
  const isInline = !!inlineHost;
  const containerClass = cn(
    isInline ? "mb-4 space-y-2 max-w-[576px]" : "fixed top-4 right-4 z-[100005] space-y-2 pointer-events-none"
  );
  const portalContent = /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: containerClass, children: toasts.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-state": t._removing ? "closed" : "open",
      className: cn(
        "openicon-toast",
        isInline ? "w-full" : "w-[300px] pointer-events-auto",
        "rounded-md border p-4",
        t.type === "success" && "bg-emerald-50 border-emerald-200 text-emerald-800",
        t.type === "error" && "bg-red-50 border-red-200 text-red-800",
        (!t.type || t.type === "info") && "bg-blue-50 border-blue-200 text-blue-800"
      ),
      children: [
        t.title && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-1 text-sm font-semibold", children: t.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm", children: t.message })
      ]
    },
    t.id
  )) });
  if (isInline && inlineHost) {
    const portal2 = reactDomExports.createPortal(portalContent, inlineHost);
    return { push, portal: portal2 };
  }
  const portal = reactDomExports.createPortal(portalContent, document.body);
  return { push, portal };
}
const Card = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    ref,
    className: cn(
      "rounded-lg border bg-white text-zinc-950 shadow-sm",
      className
    ),
    ...props
  }
));
Card.displayName = "Card";
const CardHeader = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    ref,
    className: cn("flex flex-col space-y-1.5 p-6", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
const CardTitle = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "h3",
  {
    ref,
    className: cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
CardTitle.displayName = "CardTitle";
const CardDescription = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "p",
  {
    ref,
    className: cn("text-sm text-zinc-500", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
const CardContent = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, className: cn("p-6 pt-0", className), ...props }));
CardContent.displayName = "CardContent";
const CardFooter = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    ref,
    className: cn("flex items-center p-6 pt-0", className),
    ...props
  }
));
CardFooter.displayName = "CardFooter";
const MIN_LOADING_MS = 400;
async function withMinDelay(promise, minMs = MIN_LOADING_MS) {
  const start = Date.now();
  const result = await promise;
  const elapsed = Date.now() - start;
  if (elapsed < minMs) {
    await new Promise((r) => setTimeout(r, minMs - elapsed));
  }
  return result;
}
function SettingsUI({ initialSettings }) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const toastRef = React.useRef(null);
  const { push, portal } = useToaster(toastRef.current);
  const [aLabel, setALabel] = React.useState(((_a = initialSettings.palette[0]) == null ? void 0 : _a.label) || "Primary");
  const [aHex, setAHex] = React.useState(((_b = initialSettings.palette[0]) == null ? void 0 : _b.hex) || "#18181b");
  const [bLabel, setBLabel] = React.useState(((_c = initialSettings.palette[1]) == null ? void 0 : _c.label) || "Secondary");
  const [bHex, setBHex] = React.useState(((_d = initialSettings.palette[1]) == null ? void 0 : _d.hex) || "#71717a");
  const [cLabel, setCLabel] = React.useState(((_e = initialSettings.palette[2]) == null ? void 0 : _e.label) || "Accent");
  const [cHex, setCHex] = React.useState(((_f = initialSettings.palette[2]) == null ? void 0 : _f.hex) || "#4f46e5");
  const [def, setDef] = React.useState(initialSettings.defaultToken || "A");
  const [saving, setSaving] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);
  const restBase = ((_h = (_g = window.openicon_api) == null ? void 0 : _g.root) == null ? void 0 : _h.replace(/\/$/, "")) || "/wp-json";
  const nonce = ((_i = window.openicon_api) == null ? void 0 : _i.nonce) || "";
  const apiBase = `${restBase}/openicon/v1`;
  const premiumProviders = [
    { key: "lucide", label: "Lucide Icons", count: "1,500+" },
    { key: "tabler", label: "Tabler Icons", count: "5,200+" }
  ];
  const handleSave = React.useCallback(async () => {
    setSaving(true);
    try {
      const settings = {
        activeProvider: "heroicons",
        pinnedVersion: "latest",
        palette: [
          { token: "A", label: aLabel, hex: aHex },
          { token: "B", label: bLabel, hex: bHex },
          { token: "C", label: cLabel, hex: cHex }
        ],
        defaultToken: def
      };
      const response = await withMinDelay(
        fetch(`${apiBase}/settings`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-WP-Nonce": nonce
          },
          body: JSON.stringify(settings)
        })
      );
      const data = await response.json();
      if (response.ok && data.success) {
        push({
          type: "success",
          title: "Saved",
          message: "Settings updated."
        });
      } else {
        throw new Error(data.message || "Failed to save");
      }
    } catch {
      push({
        type: "error",
        title: "Error",
        message: "Failed to save settings."
      });
    } finally {
      setSaving(false);
    }
  }, [aLabel, aHex, bLabel, bHex, cLabel, cHex, def, apiBase, nonce, push]);
  const handleRestore = React.useCallback(async () => {
    setRestoring(true);
    try {
      const response = await withMinDelay(
        fetch(`${apiBase}/settings/restore`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-WP-Nonce": nonce
          }
        })
      );
      const data = await response.json();
      if (response.ok && data.success) {
        setALabel("Primary");
        setAHex("#18181b");
        setBLabel("Secondary");
        setBHex("#71717a");
        setCLabel("Accent");
        setCHex("#4f46e5");
        setDef("A");
        push({
          type: "success",
          title: "Restored",
          message: "Defaults restored."
        });
      } else {
        throw new Error("Failed to restore");
      }
    } catch {
      push({
        type: "error",
        title: "Error",
        message: "Failed to restore defaults."
      });
    } finally {
      setRestoring(false);
    }
  }, [apiBase, nonce, push]);
  const controlClass = "max-w-[520px]";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "openicon-settings-ui mt-3", children: [
    portal,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 max-w-[576px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-emerald-800", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "svg",
              {
                className: "w-5 h-5",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: "2",
                    d: "M13 10V3L4 14h7v7l9-11h-7z"
                  }
                )
              }
            ),
            "Unlock More Icons"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-emerald-700", children: "Upgrade to ACF Open Icons Premium for access to 6,000+ icons" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: premiumProviders.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Badge,
            {
              variant: "secondary",
              className: "bg-white border border-emerald-200",
              children: [
                p.label,
                " (",
                p.count,
                ")"
              ]
            },
            p.key
          )) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-emerald-700", children: "Plus: Provider switching, icon migration tools, and priority support." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: "https://acfopenicons.com?utm_source=plugin&utm_medium=settings&utm_campaign=lite",
              target: "_blank",
              rel: "noopener noreferrer",
              className: "inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white hover:text-white rounded-md font-medium transition-colors text-sm no-underline",
              children: [
                "Get Premium",
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "svg",
                  {
                    className: "w-4 h-4",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: "2",
                        d: "M14 5l7 7m0 0l-7 7m7-7H3"
                      }
                    )
                  }
                )
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border bg-white p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[180px_1fr] items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Icon Set" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectMenu,
          {
            value: "heroicons",
            onChange: () => {
            },
            items: [
              { value: "heroicons", label: "Heroicons" },
              { value: "lucide", label: "Lucide Icons", disabled: true, badge: "Premium" },
              { value: "tabler", label: "Tabler Icons", disabled: true, badge: "Premium" },
              { value: "custom", label: "Custom Icons", disabled: true, badge: "Premium" }
            ],
            className: controlClass
          }
        )
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border bg-white p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "block mb-3", children: "Palette colours" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[180px_1fr_80px] items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "Token A" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: aLabel,
                onChange: (e) => setALabel(e.target.value),
                className: controlClass
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ColorPicker,
              {
                value: aHex,
                onChange: (e) => setAHex(e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[180px_1fr_80px] items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "Token B" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: bLabel,
                onChange: (e) => setBLabel(e.target.value),
                className: controlClass
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ColorPicker,
              {
                value: bHex,
                onChange: (e) => setBHex(e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[180px_1fr_80px] items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "Token C" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: cLabel,
                onChange: (e) => setCLabel(e.target.value),
                className: controlClass
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ColorPicker,
              {
                value: cHex,
                onChange: (e) => setCHex(e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[180px_1fr] items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Default palette token" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectMenu,
              {
                value: def,
                onChange: setDef,
                items: [{ value: "A" }, { value: "B" }, { value: "C" }],
                className: controlClass
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: handleSave,
            variant: "primary",
            disabled: saving,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: saving ? "invisible" : "", children: "Save Changes" }),
              saving && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute", children: "Saving..." })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: handleRestore,
            variant: "secondary",
            className: "border-red-200 text-red-700 hover:bg-red-50",
            disabled: restoring,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: restoring ? "invisible" : "", children: "Restore Defaults" }),
              restoring && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute", children: "Restoring..." })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: toastRef })
    ] })
  ] });
}
function mount() {
  const wrap = document.querySelector(".wrap");
  if (!wrap) {
    return;
  }
  const initialSettings = window.__OPENICON_SETTINGS__ || {
    activeProvider: "heroicons",
    pinnedVersion: "latest",
    palette: [
      { token: "A", label: "Primary", hex: "#18181b" },
      { token: "B", label: "Secondary", hex: "#71717a" },
      { token: "C", label: "Accent", hex: "#4f46e5" }
    ],
    defaultToken: "A"
  };
  const forms = wrap.querySelectorAll("form");
  forms.forEach((form) => {
    form.style.display = "none";
  });
  const existing = wrap.querySelector(".openicon-settings-ui");
  if (existing) {
    return;
  }
  const mountEl = document.createElement("div");
  wrap.appendChild(mountEl);
  createRoot(mountEl).render(/* @__PURE__ */ jsxRuntimeExports.jsx(SettingsUI, { initialSettings }));
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
