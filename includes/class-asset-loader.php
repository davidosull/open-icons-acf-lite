<?php

namespace ACFOI;

if (! defined('ABSPATH')) {
  exit;
}

class Asset_Loader {

  private static $module_script_filters_added = false;
  private const DEFAULT_DEV_ASSET = '/src/picker.tsx';

  private static function get_dev_server_scheme(): string {
    $scheme = defined('ACFOI_DEV_SERVER_SCHEME') ? (string) ACFOI_DEV_SERVER_SCHEME : 'http';
    $scheme = strtolower(trim($scheme));
    if (! in_array($scheme, ['http', 'https'], true)) {
      $scheme = 'http';
    }
    /**
     * Filter the protocol used for the dev server URL.
     *
     * @param string $scheme
     */
    $scheme = (string) apply_filters('acfoi_dev_server_scheme', $scheme);
    return in_array($scheme, ['http', 'https'], true) ? $scheme : 'http';
  }

  private static function get_dev_server_host(): string {
    $host = defined('ACFOI_DEV_SERVER_HOST') ? (string) ACFOI_DEV_SERVER_HOST : '127.0.0.1';
    $host = trim($host);
    if ($host === '') {
      $host = '127.0.0.1';
    }
    /**
     * Filter the host used for the dev server URL.
     *
     * @param string $host
     */
    $host = (string) apply_filters('acfoi_dev_server_host', $host);
    return $host !== '' ? $host : '127.0.0.1';
  }

  private static function get_dev_server_port(): int {
    $port = defined('ACFOI_DEV_SERVER_PORT') ? (int) ACFOI_DEV_SERVER_PORT : 5173;
    if ($port <= 0) {
      $port = 5173;
    }
    /**
     * Filter the port used for the dev server URL.
     *
     * @param int $port
     */
    $port = (int) apply_filters('acfoi_dev_server_port', $port);
    return $port > 0 ? $port : 5173;
  }

  private static function get_dev_asset_path(): string {
    $asset_path = defined('ACFOI_DEV_ASSET_PATH') ? (string) ACFOI_DEV_ASSET_PATH : self::DEFAULT_DEV_ASSET;
    $asset_path = '/' . ltrim($asset_path, '/');
    /**
     * Filter the asset path used when probing the dev server.
     *
     * @param string $asset_path
     */
    $asset_path = (string) apply_filters('acfoi_dev_asset_path', $asset_path);
    return '/' . ltrim($asset_path, '/');
  }

  private static function build_dev_server_url(): string {
    $scheme = self::get_dev_server_scheme();
    $host = self::get_dev_server_host();
    $port = self::get_dev_server_port();

    $base = sprintf('%s://%s', $scheme, $host);
    $default_port = $scheme === 'https' ? 443 : 80;
    if ($port !== $default_port) {
      $base .= ':' . $port;
    }
    return $base;
  }

  private static function probe_dev_asset(): array {
    $url = rtrim(self::build_dev_server_url(), '/') . '/' . ltrim(self::get_dev_asset_path(), '/');
    $result = [
      'ok' => false,
      'code' => null,
      'content_type' => null,
      'error' => null,
    ];

    if (! function_exists('wp_remote_get')) {
      $result['error'] = 'wp_remote_get unavailable';
      return $result;
    }

    $response = wp_remote_get($url, [
      'timeout' => 0.75,
      'redirection' => 1,
      'headers' => [
        'Accept' => 'application/javascript,text/html;q=0.9,*/*;q=0.1',
      ],
    ]);

    if (is_wp_error($response)) {
      $result['error'] = $response->get_error_message();
      return $result;
    }

    $code = wp_remote_retrieve_response_code($response);
    $content_type = (string) wp_remote_retrieve_header($response, 'content-type');
    $body = (string) wp_remote_retrieve_body($response);

    $result['code'] = $code;
    $result['content_type'] = $content_type;

    $is_success_code = in_array($code, [200, 304], true);
    $content_type = strtolower($content_type);
    $is_expected_type = strpos($content_type, 'javascript') !== false || strpos($content_type, 'html') !== false;
    $looks_like_vite = strpos($body, '@vite') !== false || strpos($body, 'import.meta') !== false;

    $result['ok'] = $is_success_code && $is_expected_type && $looks_like_vite;
    if (! $result['ok'] && empty($body)) {
      $result['error'] = 'Empty response body';
    }

    return $result;
  }

  public static function is_dev_mode(): bool {
    // Optional manual override via .dev file (not required for normal switching)
    $context = [
      'host' => self::get_dev_server_host(),
      'port' => self::get_dev_server_port(),
      'asset' => self::get_dev_asset_path(),
      'reason' => 'auto_probe',
      'response_code' => null,
      'content_type' => null,
      'error' => null,
    ];

    if (file_exists(ACFOI_PLUGIN_DIR . '.dev')) {
      $context['reason'] = 'dot_dev_flag';
      return (bool) apply_filters('acfoi_is_dev_mode', true, $context);
    }

    // Auto-switch: detect if Vite dev server port is open; if yes, verify asset
    $host = $context['host'];
    $port = $context['port'];
    $timeoutSeconds = 0.25; // quick non-blocking check
    $errno = 0;
    $errstr = '';
    $conn = @fsockopen($host, $port, $errno, $errstr, $timeoutSeconds);
    if (is_resource($conn)) {
      fclose($conn);
      $probe = self::probe_dev_asset();
      $context['response_code'] = $probe['code'];
      $context['content_type'] = $probe['content_type'];
      $context['error'] = $probe['error'];
      $context['reason'] = $probe['ok'] ? 'asset_probe_passed' : 'asset_probe_failed';
      return (bool) apply_filters('acfoi_is_dev_mode', (bool) $probe['ok'], $context);
    }
    $context['reason'] = 'port_closed';
    $context['error'] = $errstr ?: null;

    return (bool) apply_filters('acfoi_is_dev_mode', false, $context); // default to production assets
  }

  public static function get_vite_server_url(): string {
    return self::build_dev_server_url();
  }

  /**
   * Recursively collect all CSS files from an entry and its imports
   */
  private static function collect_css_from_manifest(array $manifest, string $entry_key, array &$collected = [], array &$visited = []): array {
    if (isset($visited[$entry_key])) {
      return $collected;
    }
    $visited[$entry_key] = true;

    $entry = $manifest[$entry_key] ?? null;
    if (! is_array($entry)) {
      return $collected;
    }

    // Collect CSS from this entry
    if (! empty($entry['css']) && is_array($entry['css'])) {
      foreach ($entry['css'] as $css_file) {
        if (! in_array($css_file, $collected, true)) {
          $collected[] = $css_file;
        }
      }
    }

    // Recursively collect from imports
    if (! empty($entry['imports']) && is_array($entry['imports'])) {
      foreach ($entry['imports'] as $import_key) {
        self::collect_css_from_manifest($manifest, $import_key, $collected, $visited);
      }
    }

    return $collected;
  }

  /**
   * Ensure module script filter is added (only once)
   */
  private static function ensure_module_script_filter(): void {
    if (self::$module_script_filters_added) {
      return;
    }

    add_filter('script_loader_tag', function ($tag, $handle) {
      if (in_array($handle, ['acfoi-picker', 'acfoi-settings', 'acfoi-vite-client'], true)) {
        // Clean up any existing type attribute and add correct one
        $tag = preg_replace('/type=["\'][^"\']*["\']\s*/', '', $tag);
        return str_replace('<script ', '<script type="module" ', $tag);
      }
      return $tag;
    }, 10, 2);

    self::$module_script_filters_added = true;
  }

  private static function enqueue_vite_client_with_preamble(): void {
    $vite_url = self::get_vite_server_url();

    // Register vite client as a handle so other scripts can depend on it
    wp_register_script('acfoi-vite-client', $vite_url . '/@vite/client', [], null, false);

    // Force type=module for the vite client
    self::ensure_module_script_filter();

    // Inject preamble BEFORE vite client so plugin-react detects it (escape $ variables)
    $preamble_tpl = <<<'JS'
import RefreshRuntime from '%VITE_URL%/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;
JS;
    $preamble = str_replace('%VITE_URL%', esc_url($vite_url), $preamble_tpl);
    wp_add_inline_script('acfoi-vite-client', $preamble, 'before');
    wp_enqueue_script('acfoi-vite-client');
  }

  public static function enqueue_picker_assets(): void {
    // Get library info for the active provider
    $settings = (new Settings(new Providers(), new Cache(new Providers(), new Sanitiser())))->get_settings();
    $provider = $settings['activeProvider'] ?? 'lucide';

    $manifestData = [];
    $path = ACFOI_PLUGIN_DIR . 'includes/manifests/' . sanitize_file_name($provider) . '.php';
    if (file_exists($path)) {
      $manifestData = include $path;
      if (! is_array($manifestData)) {
        $manifestData = [];
      }
    }

    // Extract library URL
    $libraryUrl = $manifestData['library'] ?? 'https://lucide.dev/icons';

    if (self::is_dev_mode()) {
      // Development: ensure vite client + preamble are loaded first
      self::enqueue_vite_client_with_preamble();

      // Enqueue the main entry point with dependency on client
      wp_enqueue_script(
        'acfoi-picker',
        self::get_vite_server_url() . '/src/picker.tsx',
        ['acfoi-vite-client'],
        time(),
        true
      );

      // Mark as module
      self::ensure_module_script_filter();

      // Add inline BEFORE the module script
      add_action('admin_footer', function () use ($libraryUrl, $provider) {
        $settings = (new Settings(new Providers(), new Cache(new Providers(), new Sanitiser())))->get_settings();
        $palette  = isset($settings['palette']) && is_array($settings['palette']) ? array_values($settings['palette']) : [];
        $defaultToken = $settings['defaultToken'] ?? 'A';
        $providers = (new Providers())->all();
        $providerLabel = $providers[$provider]['label'] ?? 'Lucide';
        echo '<script>window.__ACFOI_PALETTE__ = ' . wp_json_encode(['items' => $palette, 'default' => $defaultToken]) . '; window.__ACFOI_LIBRARY__ = { url: ' . wp_json_encode($libraryUrl) . ', name: ' . wp_json_encode($providerLabel) . ' };</script>' . "\n";
      }, 5);
    } else {
      $manifest_path = ACFOI_PLUGIN_DIR . 'assets/build/.vite/manifest.json';
      $manifest = [];

      if (! file_exists($manifest_path)) {
        // Manifest doesn't exist - this is an error condition
        return;
      }

      $manifest_content = file_get_contents($manifest_path);
      if ($manifest_content === false) {
        return;
      }

      $manifest = json_decode($manifest_content, true);
      if (json_last_error() !== JSON_ERROR_NONE || ! is_array($manifest)) {
        return;
      }

      $entry = $manifest['src/picker.tsx'] ?? null;

      if (! is_array($entry) || empty($entry['file'])) {
        return;
      }

      // Recursively collect all CSS from entry and its imports
      $all_css = self::collect_css_from_manifest($manifest, 'src/picker.tsx');

      // Enqueue all collected CSS
      foreach (array_unique($all_css) as $idx => $css_file) {
        $handle = $idx === 0 ? 'acfoi-picker' : 'acfoi-picker-' . ($idx + 1);
        $css_url = ACFOI_PLUGIN_URL . 'assets/build/' . ltrim($css_file, '/');
        wp_enqueue_style($handle, $css_url, [], '0.1.0');
      }

      // Enqueue JS as a module using the hashed file from the manifest
      $js_url = ACFOI_PLUGIN_URL . 'assets/build/' . ltrim($entry['file'], '/');
      wp_register_script('acfoi-picker', $js_url, [], '0.1.0', true);
      // Ensure type="module" for Vite production output
      self::ensure_module_script_filter();

      // Provide palette and library info before the module executes
      $settings = (new Settings(new Providers(), new Cache(new Providers(), new Sanitiser())))->get_settings();
      $palette  = isset($settings['palette']) && is_array($settings['palette']) ? array_values($settings['palette']) : [];
      $defaultToken = $settings['defaultToken'] ?? 'A';
      $providers = (new Providers())->all();
      $providerLabel = $providers[$provider]['label'] ?? 'Lucide';

      wp_add_inline_script('acfoi-picker', 'window.__ACFOI_PALETTE__ = ' . wp_json_encode(['items' => $palette, 'default' => $defaultToken]) . '; window.__ACFOI_LIBRARY__ = { url: ' . wp_json_encode($libraryUrl) . ', name: ' . wp_json_encode($providerLabel) . ' };', 'before');
      wp_enqueue_script('acfoi-picker');
    }
  }

  public static function enqueue_settings_assets(): void {
    // Localise palette for settings UI as well
    $settings = (new Settings(new Providers(), new Cache(new Providers(), new Sanitiser())))->get_settings();
    $palette  = isset($settings['palette']) && is_array($settings['palette']) ? array_values($settings['palette']) : [];
    $defaultToken = $settings['defaultToken'] ?? 'A';

    // Get library info for the active provider
    $provider = $settings['activeProvider'] ?? 'lucide';
    $manifestData = [];
    $path = ACFOI_PLUGIN_DIR . 'includes/manifests/' . sanitize_file_name($provider) . '.php';
    if (file_exists($path)) {
      $manifestData = include $path;
      if (! is_array($manifestData)) {
        $manifestData = [];
      }
    }
    $libraryUrl = $manifestData['library'] ?? 'https://lucide.dev/icons';
    $providers = (new Providers())->all();
    $providerLabel = $providers[$provider]['label'] ?? 'Lucide';

    // Provide REST API settings for JavaScript (must be available before module scripts)
    // Output directly in admin_head to ensure it's available early
    add_action('admin_head', function () {
      // Always output - don't check for wp-api script
      echo '<script>window.wpApiSettings = window.wpApiSettings || ' . wp_json_encode([
        'root' => esc_url_raw(rest_url()),
        'nonce' => wp_create_nonce('wp_rest'),
      ]) . ';</script>' . "\n";
    }, 1);

    if (self::is_dev_mode()) {
      self::enqueue_vite_client_with_preamble();
      wp_enqueue_script(
        'acfoi-settings',
        self::get_vite_server_url() . '/src/settings.tsx',
        ['acfoi-vite-client'],
        time(),
        true
      );
      self::ensure_module_script_filter();
      add_action('admin_footer', function () use ($palette, $defaultToken, $libraryUrl, $providerLabel) {
        echo '<script>window.__ACFOI_PALETTE__ = ' . wp_json_encode(['items' => $palette, 'default' => $defaultToken]) . '; window.__ACFOI_LIBRARY__ = { url: ' . wp_json_encode($libraryUrl) . ', name: ' . wp_json_encode($providerLabel) . ' };</script>' . "\n";
      }, 5);
    } else {
      $manifest_path = ACFOI_PLUGIN_DIR . 'assets/build/.vite/manifest.json';
      $manifest = [];

      if (! file_exists($manifest_path)) {
        // Manifest doesn't exist - this is an error condition
        return;
      }

      $manifest_content = file_get_contents($manifest_path);
      if ($manifest_content === false) {
        return;
      }

      $manifest = json_decode($manifest_content, true);
      if (json_last_error() !== JSON_ERROR_NONE || ! is_array($manifest)) {
        return;
      }

      $entry = $manifest['src/settings.tsx'] ?? null;

      if (! is_array($entry) || empty($entry['file'])) {
        return;
      }

      // Recursively collect all CSS from entry and its imports
      $all_css = self::collect_css_from_manifest($manifest, 'src/settings.tsx');

      // Enqueue all collected CSS
      foreach (array_unique($all_css) as $idx => $css_file) {
        $handle = $idx === 0 ? 'acfoi-settings' : 'acfoi-settings-' . ($idx + 1);
        $css_url = ACFOI_PLUGIN_URL . 'assets/build/' . ltrim($css_file, '/');
        wp_enqueue_style($handle, $css_url, [], '0.1.0');
      }

      // Enqueue JS as a module using the hashed file from the manifest
      $js_url = ACFOI_PLUGIN_URL . 'assets/build/' . ltrim($entry['file'], '/');
      wp_register_script('acfoi-settings', $js_url, [], '0.1.0', true);
      // Ensure type="module" for Vite production output
      self::ensure_module_script_filter();

      // Provide REST API settings (also output in admin_head for dev mode, but ensure it's here too)
      wp_localize_script('acfoi-settings', 'wpApiSettings', [
        'root' => esc_url_raw(rest_url()),
        'nonce' => wp_create_nonce('wp_rest'),
      ]);

      // Provide palette and library info before the module executes
      wp_add_inline_script('acfoi-settings', 'window.__ACFOI_PALETTE__ = ' . wp_json_encode(['items' => $palette, 'default' => $defaultToken]) . '; window.__ACFOI_LIBRARY__ = { url: ' . wp_json_encode($libraryUrl) . ', name: ' . wp_json_encode($providerLabel) . ' };', 'before');
      wp_enqueue_script('acfoi-settings');
    }
  }
}
