/* @refresh reload */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import './styles.css';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { SelectMenu } from './components/ui/select-menu';
import { Button } from './components/ui/button';
import { ColorPicker } from './components/ui/color-picker';
import { useToaster } from './components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';
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
import IconPicker from './components/IconPicker';

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
  const [originalProvider, setOriginalProvider] = React.useState(
    providerEl?.value || 'lucide'
  );
  const [aLabel, setALabel] = React.useState(pALabelEl?.value || 'Primary');
  const [aHex, setAHex] = React.useState(pAHexEl?.value || '#111111');
  const [bLabel, setBLabel] = React.useState(pBLabelEl?.value || 'Secondary');
  const [bHex, setBHex] = React.useState(pBHexEl?.value || '#888888');
  const [cLabel, setCLabel] = React.useState(pCLabelEl?.value || 'Accent');
  const [cHex, setCHex] = React.useState(pCHexEl?.value || '#0ea5e9');
  const [def, setDef] = React.useState(defaultTokenEl?.value || 'A');

  // Migration state
  const [migrationStatus, setMigrationStatus] = React.useState<any>(null);
  const [loadingMigrationStatus, setLoadingMigrationStatus] =
    React.useState(false);
  const [migratingIconKey, setMigratingIconKey] = React.useState<string | null>(
    null
  );
  const [showIconPicker, setShowIconPicker] = React.useState(false);
  const [selectedIcons, setSelectedIcons] = React.useState<
    Record<string, { key: string; svg?: string }>
  >({});
  const [migrationInstances, setMigrationInstances] = React.useState<any[]>([]);
  const [oldIconSvg, setOldIconSvg] = React.useState<Record<string, string>>(
    {}
  );
  const [migratingIcons, setMigratingIcons] = React.useState<
    Record<string, boolean>
  >({});

  // License state
  const [licenseStatus, setLicenseStatus] = React.useState<any>(null);
  const [loadingLicense, setLoadingLicense] = React.useState(false);
  const [licenseKey, setLicenseKey] = React.useState('');
  const [activatingLicense, setActivatingLicense] = React.useState(false);
  const [deactivatingLicense, setDeactivatingLicense] = React.useState(false);
  const [updateAvailable, setUpdateAvailable] = React.useState<any>(null);

  const restBase =
    (window as any).wpApiSettings?.root?.replace(/\/$/, '') || '/wp-json';
  const nonce = (window as any).wpApiSettings?.nonce || '';

  // Fetch license status
  const fetchLicenseStatus = React.useCallback(async () => {
    setLoadingLicense(true);
    try {
      const url = `${restBase}/acf-open-icons/v1/license`;
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-WP-Nonce': nonce,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLicenseStatus(data);
      }
    } catch (error) {
      // Error fetching license status
    } finally {
      setLoadingLicense(false);
    }
  }, [restBase, nonce]);

  // Load license status on mount
  React.useEffect(() => {
    fetchLicenseStatus();
  }, [fetchLicenseStatus]);

  // Activate license
  const handleActivateLicense = React.useCallback(async () => {
    if (!licenseKey.trim()) {
      push({
        type: 'error',
        title: 'Error',
        message: 'Please enter a license key',
      });
      return;
    }

    setActivatingLicense(true);
    try {
      const url = `${restBase}/acf-open-icons/v1/license/activate`;
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce,
        },
        body: JSON.stringify({ license_key: licenseKey.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        push({
          type: 'success',
          title: 'License Activated',
          message: data.message || 'License activated successfully',
        });
        setLicenseKey('');
        await fetchLicenseStatus();
      } else {
        push({
          type: 'error',
          title: 'Activation Failed',
          message: data.message || 'Failed to activate license',
        });
      }
    } catch (error) {
      push({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while activating the license',
      });
    } finally {
      setActivatingLicense(false);
    }
  }, [licenseKey, restBase, nonce, push, fetchLicenseStatus]);

  // Deactivate license
  const handleDeactivateLicense = React.useCallback(async () => {
    setDeactivatingLicense(true);
    try {
      const url = `${restBase}/acf-open-icons/v1/license/deactivate`;
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-WP-Nonce': nonce,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        push({
          type: 'success',
          title: 'License Deactivated',
          message: data.message || 'License deactivated successfully',
        });
        await fetchLicenseStatus();
      } else {
        push({
          type: 'error',
          title: 'Deactivation Failed',
          message: data.message || 'Failed to deactivate license',
        });
      }
    } catch (error) {
      push({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while deactivating the license',
      });
    } finally {
      setDeactivatingLicense(false);
    }
  }, [restBase, nonce, push, fetchLicenseStatus]);

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (
    status: string
  ): 'default' | 'secondary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'grace_period':
        return 'warning';
      case 'expired':
        return 'error';
      default:
        return 'secondary';
    }
  };

  // Fetch migration status
  const fetchMigrationStatus = React.useCallback(
    async (providerOverride?: string) => {
      setLoadingMigrationStatus(true);
      try {
        // Always use the saved provider from the API, not the selected one
        // The API will return icons that don't match the CURRENT saved provider
        // If providerOverride is provided (when provider changes), we still want to see
        // what icons exist from OTHER providers, so we don't pass it to the API
        const url = `${restBase}/acf-open-icons/v1/migration/status`;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (nonce) {
          headers['X-WP-Nonce'] = nonce;
        }

        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include', // Include cookies for authentication
          headers,
        });
        if (response.ok) {
          const data = await response.json();
          setMigrationStatus(data);
        } else {
          await response.json().catch(() => ({}));
        }
      } catch (error) {
        // Fetch error
      } finally {
        setLoadingMigrationStatus(false);
      }
    },
    [restBase, nonce]
  );

  // Load migration status on mount and after migrations
  React.useEffect(() => {
    fetchMigrationStatus();
  }, [fetchMigrationStatus]);

  // Fetch migration status when provider changes (to show what would need migration)
  React.useEffect(() => {
    if (provider !== originalProvider) {
      // Don't pass providerOverride - let API use saved provider to find non-current icons
      fetchMigrationStatus();
    }
  }, [provider, originalProvider, fetchMigrationStatus]);

  // Refresh migration status after settings are saved (check for URL param or form submission)
  React.useEffect(() => {
    const checkForSave = () => {
      const url = new URL(window.location.href);
      // Check if we just saved (settings page might redirect or reload)
      // Also check periodically after mount in case of redirect
      if (
        url.searchParams.has('settings-updated') ||
        url.searchParams.has('migrated')
      ) {
        setTimeout(() => {
          fetchMigrationStatus();
        }, 500);
      }
    };

    checkForSave();
    // Also check after a short delay in case of page reload
    const timeout = setTimeout(() => {
      checkForSave();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [fetchMigrationStatus]);

  React.useEffect(() => {
    if (providerEl) providerEl.value = provider;
  }, [provider]);

  // Handle provider change
  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
  };

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
      // Refresh migration status after save
      setTimeout(() => {
        fetchMigrationStatus();
      }, 500);
    } else if (ss === 'settings_saved') {
      push({
        type: 'success',
        title: 'Saved',
        message: 'Settings updated.',
      });
      setTimeout(() => {
        fetchMigrationStatus();
      }, 500);
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
  }, [push, fetchMigrationStatus]);

  const controlClass = 'max-w-[520px]';

  // Fetch old icon SVGs for migration preview
  React.useEffect(() => {
    if (
      !migrationStatus?.non_current ||
      migrationStatus.non_current.length === 0
    )
      return;

    const groupedIcons: Record<string, any[]> = {};
    migrationStatus.non_current.forEach((icon: any) => {
      // Icon structure: { value: { provider: 'lucide', iconKey: 'alarm-check', ... }, type: 'post_meta', ... }
      const iconKey = icon.value?.iconKey || icon.iconKey || icon.key;
      if (!iconKey) return;
      if (!groupedIcons[iconKey]) {
        groupedIcons[iconKey] = [];
      }
      groupedIcons[iconKey].push(icon);
    });

    Object.entries(groupedIcons).forEach(([iconKey, icons]) => {
      if (oldIconSvg[iconKey]) return; // Already loaded

      // Get provider from icon.value.provider
      const oldProvider = icons[0]?.value?.provider || icons[0]?.provider;
      if (!oldProvider || oldProvider === 'unknown') {
        return;
      }

      const url = `${restBase}/acf-open-icons/v1/icon?provider=${encodeURIComponent(
        oldProvider
      )}&version=latest&key=${encodeURIComponent(iconKey)}`;
      fetch(url)
        .then((r) => {
          if (!r.ok) {
            return null;
          }
          return r.text();
        })
        .then((svg) => {
          if (svg) {
            setOldIconSvg((prev) => ({ ...prev, [iconKey]: svg }));
          }
        })
        .catch(() => {
          // Error fetching old icon
        });
    });
  }, [migrationStatus, restBase]);

  // Migration functions
  const handleIconSelected = React.useCallback(
    (item: { key: string; svg?: string }) => {
      if (!migratingIconKey) {
        return;
      }

      // Store migratingIconKey before clearing it
      const iconKeyToMigrate = migratingIconKey;

      // Close picker FIRST to ensure immediate visual feedback
      // Use flushSync to force immediate React update and visual close
      flushSync(() => {
        setShowIconPicker(false);
        setMigratingIconKey(null);
        setMigrationInstances([]);
      });

      // Update selectedIcons immediately after close (don't wait for next frame)
      // Store selection for this specific icon key
      setSelectedIcons((prev) => ({
        ...prev,
        [iconKeyToMigrate]: { key: item.key, svg: item.svg },
      }));

      // Fetch SVG in background if not provided
      if (!item.svg) {
        const currentProvider = migrationStatus?.current_provider || provider;
        const currentVersion = versionEl?.value || 'latest';
        const url = `${restBase}/acf-open-icons/v1/icon?provider=${encodeURIComponent(
          currentProvider
        )}&version=${encodeURIComponent(
          currentVersion
        )}&key=${encodeURIComponent(item.key)}`;
        fetch(url)
          .then((r) => r.text())
          .then((svg) => {
            setSelectedIcons((prev) => ({
              ...prev,
              [iconKeyToMigrate]: { key: item.key, svg },
            }));
          })
          .catch(() => {
            // Background SVG fetch failed
          });
      }
    },
    [migratingIconKey, migrationStatus, provider, versionEl, restBase]
  );

  const handleMigrateIcon = React.useCallback(
    async (oldIconKey: string, newIconKey: string, suppressToast = false) => {
      if (!newIconKey) {
        return {
          success: false,
          migratedCount: 0,
          error: 'No new icon key provided',
        };
      }

      // Set loading state for this specific icon
      setMigratingIcons((prev) => ({ ...prev, [oldIconKey]: true }));

      const currentProvider = migrationStatus?.current_provider || provider;
      const currentVersion = versionEl?.value || 'latest';

      try {
        const requestBody = {
          oldIconKey,
          newIconKey,
          newProvider: currentProvider,
          newVersion: currentVersion,
        };

        const response = await fetch(
          `${restBase}/acf-open-icons/v1/migration/migrate-icon`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-WP-Nonce': nonce,
            },
            body: JSON.stringify(requestBody),
          }
        );

        const data = await response.json();

        if (response.ok && data.ok) {
          if (!suppressToast) {
            push({
              type: 'success',
              title: 'Migration Complete',
              message: `Successfully migrated ${data.migrated_count} instance${
                data.migrated_count !== 1 ? 's' : ''
              } of "${oldIconKey}" to "${newIconKey}".`,
            });
          }

          // Clear selection for this icon
          setSelectedIcons((prev) => {
            const next = { ...prev };
            delete next[oldIconKey];
            return next;
          });
          setOldIconSvg((prev) => {
            const next = { ...prev };
            delete next[oldIconKey];
            return next;
          });

          // Refresh migration status (no page reload) - only if not suppressing toast (single migration)
          if (!suppressToast) {
            await fetchMigrationStatus();
          }

          return { success: true, migratedCount: data.migrated_count || 0 };
        } else {
          if (!suppressToast) {
            push({
              type: 'error',
              title: 'Migration Failed',
              message:
                data.message || 'Failed to migrate icon. Please try again.',
            });
          }
          return {
            success: false,
            migratedCount: 0,
            error: data.message || 'Failed to migrate icon',
          };
        }
      } catch (error) {
        if (!suppressToast) {
          push({
            type: 'error',
            title: 'Migration Error',
            message:
              'An error occurred while migrating the icon. Please try again.',
          });
        }
        return {
          success: false,
          migratedCount: 0,
          error: 'An error occurred while migrating the icon',
        };
      } finally {
        setMigratingIcons((prev) => {
          const next = { ...prev };
          delete next[oldIconKey];
          return next;
        });
      }
    },
    [
      migrationStatus,
      provider,
      versionEl,
      restBase,
      nonce,
      push,
      fetchMigrationStatus,
    ]
  );

  // Check if provider changed from original
  const providerChanged = provider !== originalProvider;

  // Determine which provider to use for comparison (selected or saved)
  const comparisonProvider = providerChanged
    ? provider
    : migrationStatus?.current_provider || provider;

  // Group non-current icons by iconKey
  const groupedIcons = React.useMemo(() => {
    if (!migrationStatus?.grouped_by_icon) return {};
    return migrationStatus.grouped_by_icon;
  }, [migrationStatus]);

  // Show migration section if there are non-current icons OR if provider changed (to show what would need migration)
  const hasNonCurrentIcons =
    (migrationStatus?.non_current && migrationStatus.non_current.length > 0) ||
    providerChanged;

  // Check if license is valid (active or grace period)
  const isLicenseValid =
    licenseStatus?.status === 'active' ||
    licenseStatus?.status === 'grace_period';

  return (
    <div className='acfoi-settings-ui mt-3'>
      <div ref={toastRef} />
      {portal}
      <div className='space-y-6 max-w-[576px]'>
        {/* License Section - Always visible */}
        <Card>
          <CardHeader>
            <Label className='block'>License</Label>
            <CardDescription>
              Manage your ACF Open Icons license
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {loadingLicense ? (
              <p className='text-sm text-gray-600'>Loading license status...</p>
            ) : licenseStatus?.license_key ? (
              <>
                <div className='space-y-4'>
                  <div className='grid grid-cols-[180px_1fr] items-center gap-3'>
                    <Label>Status</Label>
                    <div>
                      <Badge
                        variant={getStatusBadgeVariant(
                          licenseStatus.status || 'invalid'
                        )}
                      >
                        {licenseStatus.status === 'active'
                          ? 'Active'
                          : licenseStatus.status === 'grace_period'
                          ? 'Grace Period'
                          : licenseStatus.status === 'expired'
                          ? 'Expired'
                          : 'Invalid'}
                      </Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className='grid gap-3'>
                    <div className='grid grid-cols-[180px_1fr] items-center gap-3'>
                      <Label>Purchase Date</Label>
                      <span className='text-sm'>
                        {formatDate(licenseStatus.purchase_date)}
                      </span>
                    </div>
                    <div className='grid grid-cols-[180px_1fr] items-center gap-3'>
                      <Label>Billing Cycle</Label>
                      <span className='text-sm capitalize'>
                        {licenseStatus.billing_cycle || 'N/A'}
                      </span>
                    </div>
                    <div className='grid grid-cols-[180px_1fr] items-center gap-3'>
                      <Label>Next Payment</Label>
                      <span className='text-sm'>
                        {formatDate(licenseStatus.next_payment)}
                      </span>
                    </div>
                    <div className='grid grid-cols-[180px_1fr] items-center gap-3'>
                      <Label>Expires</Label>
                      <span className='text-sm'>
                        {formatDate(licenseStatus.expires_at)}
                      </span>
                    </div>
                  </div>
                  {licenseStatus.status === 'grace_period' && (
                    <Alert variant='warning'>
                      <AlertTitle>Grace Period</AlertTitle>
                      <AlertDescription>
                        Your license has expired. You have a 7-day grace period
                        to renew.
                      </AlertDescription>
                    </Alert>
                  )}
                  {licenseStatus.status === 'expired' && (
                    <Alert variant='error'>
                      <AlertTitle>License Expired</AlertTitle>
                      <AlertDescription>
                        Your license has expired. Please renew to continue using
                        the plugin.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <div className='pt-2'>
                  <Button
                    onClick={handleDeactivateLicense}
                    variant='secondary'
                    disabled={deactivatingLicense}
                  >
                    {deactivatingLicense
                      ? 'Deactivating...'
                      : 'Deactivate License'}
                  </Button>
                </div>
              </>
            ) : (
              <div className='space-y-4'>
                <div className='grid grid-cols-[180px_1fr] items-center gap-3'>
                  <Label htmlFor='license-key'>License Key</Label>
                  <Input
                    id='license-key'
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder='Enter your license key'
                  />
                </div>
                <div className='pt-2'>
                  <Button
                    onClick={handleActivateLicense}
                    variant='primary'
                    disabled={activatingLicense || !licenseKey.trim()}
                  >
                    {activatingLicense ? 'Activating...' : 'Activate License'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Show warning if license is not valid (only show if no license key or expired, not for grace period) */}
        {!licenseStatus?.license_key || licenseStatus?.status === 'expired' ? (
          <Alert variant={!licenseStatus?.license_key ? 'warning' : 'error'}>
            <AlertTitle>
              {!licenseStatus?.license_key
                ? 'License Required'
                : 'License Expired'}
            </AlertTitle>
            <AlertDescription>
              {!licenseStatus?.license_key
                ? 'Please activate your license to access settings and use the icon picker.'
                : 'Your license has expired. Please renew your license to access settings and use the icon picker.'}
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Settings sections - Only show if license is valid */}
        {isLicenseValid && (
          <>
            <div className='rounded-md border bg-white p-4'>
              <div className='grid gap-4'>
                <div className='grid grid-cols-[180px_1fr] items-center gap-3'>
                  <Label>Icon Set</Label>
                  <SelectMenu
                    value={provider}
                    onChange={handleProviderChange}
                    items={providerOptions}
                    className={controlClass}
                  />
                </div>
                {providerChanged && (
                  <Alert variant='warning'>
                    <AlertTitle>Provider Change Detected</AlertTitle>
                    <AlertDescription className='mt-2 space-y-2'>
                      <p>
                        Changing the icon provider will require migrating all
                        stored icons in your content.
                      </p>
                      <ul className='list-disc list-inside space-y-1 ml-2'>
                        <li>
                          Icons with matching names will be automatically
                          migrated
                        </li>
                        <li>Icons without matches will need manual review</li>
                        <li>
                          After saving, you can use the migration tool below to
                          manually migrate unmatched icons
                        </li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
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

            {/* Migration Section - Show if there are non-current provider icons OR if provider changed */}
            {(hasNonCurrentIcons || loadingMigrationStatus) && (
              <div className='rounded-md border bg-white p-4 space-y-4'>
                <div className='flex items-center justify-between'>
                  <Label className='block'>Icon Migration</Label>
                  <div className='flex items-center gap-2'>
                    {Object.keys(selectedIcons).length > 0 && (
                      <Button
                        type='button'
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const iconsToMigrate = Object.entries(selectedIcons);

                          const results: Array<{
                            oldIconKey: string;
                            newIconKey: string;
                            success: boolean;
                            migratedCount: number;
                            error?: string;
                          }> = [];

                          for (const [
                            oldIconKey,
                            selectedIcon,
                          ] of iconsToMigrate) {
                            if (selectedIcon.key) {
                              const result = await handleMigrateIcon(
                                oldIconKey,
                                selectedIcon.key,
                                true
                              ); // Pass true to suppress toast
                              results.push({
                                oldIconKey,
                                newIconKey: selectedIcon.key,
                                success: result.success,
                                migratedCount: result.migratedCount || 0,
                                error: result.error,
                              });
                            }
                          }

                          // Refresh migration status after all migrations complete
                          await fetchMigrationStatus();

                          // Show single summary toast
                          const successful = results.filter((r) => r.success);
                          const failed = results.filter((r) => !r.success);
                          const totalMigrated = successful.reduce(
                            (sum, r) => sum + r.migratedCount,
                            0
                          );

                          if (failed.length === 0) {
                            // All successful
                            push({
                              type: 'success',
                              title: 'Migration Complete',
                              message: `Successfully migrated ${totalMigrated} instance${
                                totalMigrated !== 1 ? 's' : ''
                              } across ${successful.length} icon${
                                successful.length !== 1 ? 's' : ''
                              }.`,
                            });
                          } else if (successful.length === 0) {
                            // All failed
                            push({
                              type: 'error',
                              title: 'Migration Failed',
                              message: `Failed to migrate ${
                                failed.length
                              } icon${
                                failed.length !== 1 ? 's' : ''
                              }. Please try again.`,
                            });
                          } else {
                            // Partial success
                            push({
                              type: 'success',
                              title: 'Migration Partially Complete',
                              message: `Successfully migrated ${totalMigrated} instance${
                                totalMigrated !== 1 ? 's' : ''
                              } across ${successful.length} icon${
                                successful.length !== 1 ? 's' : ''
                              }. ${failed.length} icon${
                                failed.length !== 1 ? 's' : ''
                              } failed.`,
                            });
                          }
                        }}
                        variant='primary'
                        className='text-xs'
                        disabled={Object.values(migratingIcons).some(Boolean)}
                      >
                        Migrate All ({Object.keys(selectedIcons).length})
                      </Button>
                    )}
                    <Button
                      onClick={() =>
                        fetchMigrationStatus(
                          providerChanged ? provider : undefined
                        )
                      }
                      variant='secondary'
                      className='text-xs'
                      disabled={loadingMigrationStatus}
                    >
                      {loadingMigrationStatus ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </div>
                </div>

                <div className='space-y-3'>
                  {loadingMigrationStatus ? (
                    <p className='text-sm text-gray-600'>
                      Loading migration status...
                    </p>
                  ) : migrationStatus?.non_current &&
                    migrationStatus.non_current.length > 0 ? (
                    <>
                      <CardDescription>
                        Found {migrationStatus.non_current.length} icon instance
                        {migrationStatus.non_current.length !== 1
                          ? 's'
                          : ''}{' '}
                        from non-current provider
                        {migrationStatus.by_provider &&
                        Object.keys(migrationStatus.by_provider).filter(
                          (p) => p !== comparisonProvider
                        ).length > 1
                          ? 's'
                          : ''}
                        . Group by icon name to migrate all instances at once.
                      </CardDescription>

                      {Object.keys(groupedIcons).length > 0 && (
                        <div className='space-y-2'>
                          {Object.entries(groupedIcons).map(
                            ([iconKey, icons]: [string, any[]]) => {
                              const selectedIcon = selectedIcons[iconKey];
                              const isMigrating = migratingIcons[iconKey];

                              return (
                                <div
                                  key={iconKey}
                                  className='border rounded-md p-4 bg-white hover:bg-gray-50 transition-colors'
                                >
                                  <div className='flex items-center justify-between gap-4'>
                                    {/* Left: Icon previews and name */}
                                    <div className='flex items-center gap-3 flex-1 min-w-0'>
                                      {/* Old Icon - Match ACF field preview style */}
                                      <div className='flex items-center gap-2 flex-shrink-0'>
                                        {oldIconSvg[iconKey] ? (
                                          <div
                                            className='flex items-center justify-center bg-white'
                                            style={{
                                              width: '40px',
                                              height: '40px',
                                              border: '1px solid #ddd',
                                              borderRadius: '4px',
                                              lineHeight: 0,
                                            }}
                                            dangerouslySetInnerHTML={{
                                              __html: oldIconSvg[iconKey],
                                            }}
                                          />
                                        ) : (
                                          <div
                                            className='bg-gray-50 animate-pulse'
                                            style={{
                                              width: '40px',
                                              height: '40px',
                                              border: '1px solid #ddd',
                                              borderRadius: '4px',
                                            }}
                                          />
                                        )}
                                      </div>

                                      {/* Icon name */}
                                      <div className='flex flex-col min-w-0'>
                                        <span className='font-mono text-sm font-medium text-gray-900 truncate'>
                                          {iconKey}
                                        </span>
                                        <span className='text-xs text-gray-500'>
                                          {icons.length} instance
                                          {icons.length !== 1 ? 's' : ''}
                                        </span>
                                      </div>

                                      {/* Arrow and new icon - Match ACF field preview style */}
                                      {selectedIcon && (
                                        <>
                                          <span className='text-gray-300 flex-shrink-0'>
                                            →
                                          </span>
                                          <div className='flex items-center gap-2 flex-shrink-0'>
                                            {selectedIcon.svg ? (
                                              <div
                                                className='flex items-center justify-center bg-white'
                                                style={{
                                                  width: '40px',
                                                  height: '40px',
                                                  border: '2px solid #10b981',
                                                  borderRadius: '4px',
                                                  lineHeight: 0,
                                                  backgroundColor: '#f0fdf4',
                                                }}
                                                dangerouslySetInnerHTML={{
                                                  __html: selectedIcon.svg,
                                                }}
                                              />
                                            ) : (
                                              <div
                                                className='bg-green-50 animate-pulse'
                                                style={{
                                                  width: '40px',
                                                  height: '40px',
                                                  border: '2px solid #10b981',
                                                  borderRadius: '4px',
                                                }}
                                              />
                                            )}
                                            <span className='font-mono text-sm font-medium text-green-700'>
                                              {selectedIcon.key}
                                            </span>
                                          </div>
                                        </>
                                      )}
                                    </div>

                                    {/* Right: Actions */}
                                    <div className='flex items-center gap-2 flex-shrink-0'>
                                      {selectedIcon ? (
                                        <>
                                          <Button
                                            onClick={() => {
                                              setMigratingIconKey(iconKey);
                                              setMigrationInstances(icons);
                                              setShowIconPicker(true);
                                            }}
                                            variant='secondary'
                                            className='text-xs'
                                            disabled={isMigrating}
                                          >
                                            Change
                                          </Button>
                                          <Button
                                            type='button'
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleMigrateIcon(
                                                iconKey,
                                                selectedIcon.key
                                              );
                                            }}
                                            variant='primary'
                                            className='text-xs'
                                            disabled={isMigrating}
                                          >
                                            {isMigrating
                                              ? 'Migrating...'
                                              : `Migrate ${icons.length}`}
                                          </Button>
                                        </>
                                      ) : (
                                        <Button
                                          onClick={() => {
                                            setMigratingIconKey(iconKey);
                                            setMigrationInstances(icons);
                                            setShowIconPicker(true);
                                          }}
                                          variant='primary'
                                          className='text-xs'
                                        >
                                          Select Icon
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Locations details */}
                                  <details className='mt-3 pt-3 border-t'>
                                    <summary className='cursor-pointer text-xs text-gray-600 hover:text-gray-900 list-none'>
                                      <span className='flex items-center gap-1'>
                                        <svg
                                          className='w-4 h-4'
                                          fill='none'
                                          stroke='currentColor'
                                          viewBox='0 0 24 24'
                                        >
                                          <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M19 9l-7 7-7-7'
                                          />
                                        </svg>
                                        View locations ({icons.length})
                                      </span>
                                    </summary>
                                    <div className='mt-2 space-y-1 pl-5'>
                                      {icons.map((icon: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className='text-xs text-gray-600 flex items-center justify-between py-1'
                                        >
                                          <span>
                                            {icon.post_title || 'Unknown'}
                                            {icon.post_type &&
                                              icon.post_type !== 'options' && (
                                                <span className='text-gray-400 ml-1'>
                                                  ({icon.post_type})
                                                </span>
                                              )}
                                          </span>
                                          {icon.edit_link && (
                                            <a
                                              href={icon.edit_link}
                                              target='_blank'
                                              rel='noopener noreferrer'
                                              className='text-blue-600 hover:text-blue-800 ml-2'
                                            >
                                              Edit
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </>
                  ) : providerChanged ? (
                    <p className='text-sm text-gray-600'>
                      After saving, icons with matching names will be
                      automatically migrated. Icons without matches will appear
                      here for manual migration.
                    </p>
                  ) : (
                    <p className='text-sm text-gray-600'>
                      No icons found that need migration.
                    </p>
                  )}
                </div>
              </div>
            )}

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
          </>
        )}
      </div>

      {/* Migration Icon Picker Dialog */}
      {migratingIconKey && showIconPicker && (
        <IconPicker
          open={showIconPicker}
          onOpenChange={(open) => {
            setShowIconPicker(open);
            if (!open) {
              // Clear migration state when closing
              setMigratingIconKey(null);
              setMigrationInstances([]);
            }
          }}
          provider={migrationStatus?.current_provider || provider}
          version={versionEl?.value || 'latest'}
          disableColorPicker={true}
          onSelect={(item) => {
            handleIconSelected({ key: item.key, svg: item.svg });
          }}
        />
      )}
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
