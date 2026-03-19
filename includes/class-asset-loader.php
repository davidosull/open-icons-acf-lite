<?php

namespace OPENICON;

if (! defined('ABSPATH')) {
  exit;
}

/**
 * Asset loader for ACF Open Icons Lite.
 */
class Asset_Loader {

  private static $module_script_filters_added = false;
  private static $dev_mode_cache = null;
  private static $working_dev_host = null;
  private const DEFAULT_DEV_HEALTH_PATH = '/_openicon-dev-health';
  private const DEV_HEALTH_HEADER = 'x-openicon-dev-server';
  private const DEV_HEALTH_HEADER_VALUE = 'open-icons-acf';
  private const DEV_HEALTH_SIGNATURE = 'openicon:dev:ok';

  private static function get_dev_config(): array {
    $scheme = defined('OPENICON_DEV_SERVER_SCHEME') ? (string) OPENICON_DEV_SERVER_SCHEME : 'http';
    $host = defined('OPENICON_DEV_SERVER_HOST') ? (string) OPENICON_DEV_SERVER_HOST : '127.0.0.1';
    $port = defined('OPENICON_DEV_SERVER_PORT') ? (int) OPENICON_DEV_SERVER_PORT : 5174;

    $config = apply_filters('openicon_dev_server_config', [
      'scheme' => in_array(strtolower(trim($scheme)), ['http', 'https'], true) ? strtolower(trim($scheme)) : 'http',
      'host' => trim($host) ?: '127.0.0.1',
      'port' => $port > 0 ? $port : 5174,
    ]);

    return [
      'scheme' => $config['scheme'] ?? 'http',
      'host' => $config['host'] ?? '127.0.0.1',
      'port' => $config['port'] ?? 5174,
    ];
  }

  private static function build_dev_server_url(?string $host = null): string {
    $config = self::get_dev_config();
    $host = $host ?? self::$working_dev_host ?? $config['host'];
    $base = sprintf('%s://%s', $config['scheme'], $host);
    $default_port = $config['scheme'] === 'https' ? 443 : 80;
    if ($config['port'] !== $default_port) {
      $base .= ':' . $config['port'];
    }
    return $base;
  }

  private static function try_hosts(int $port, float $timeout = 0.25): ?string {
    $config = self::get_dev_config();
    $hosts = [$config['host']];

    if ($config['host'] === '127.0.0.1') {
      $hosts[] = 'localhost';
    } elseif ($config['host'] === 'localhost') {
      $hosts[] = '127.0.0.1';
    }

    foreach ($hosts as $host) {
      // Use wp_remote_get with a very short timeout to check if server is reachable
      $url = sprintf('%s://%s:%d/', $config['scheme'], $host, $port);
      $response = wp_remote_get($url, [
        'timeout' => $timeout,
        'redirection' => 0,
        'sslverify' => false,
      ]);

      // If we get any response (even an error page), the server is running
      if (! is_wp_error($response)) {
        return $host;
      }
    }

    return null;
  }

  private static function probe_dev_health(string $host): array {
    $base_url = self::build_dev_server_url($host);
    $url = rtrim($base_url, '/') . self::DEFAULT_DEV_HEALTH_PATH;

    if (! function_exists('wp_remote_get')) {
      return ['ok' => false, 'error' => 'wp_remote_get unavailable'];
    }

    $response = wp_remote_get($url, [
      'timeout' => 1.0,
      'redirection' => 0,
      'sslverify' => false,
      'headers' => ['Accept' => 'application/json'],
    ]);

    if (is_wp_error($response)) {
      return ['ok' => false, 'error' => $response->get_error_message()];
    }

    $code = wp_remote_retrieve_response_code($response);
    if ($code !== 200) {
      return ['ok' => false, 'error' => "Status code: {$code}"];
    }

    $body = (string) wp_remote_retrieve_body($response);
    $header_val = strtolower((string) wp_remote_retrieve_header($response, self::DEV_HEALTH_HEADER));

    $has_signature = strpos($body, self::DEV_HEALTH_SIGNATURE) !== false;
    $has_header = $header_val === self::DEV_HEALTH_HEADER_VALUE;

    if ($has_signature && $has_header) {
      return ['ok' => true];
    }

    return ['ok' => false, 'error' => 'Health check failed'];
  }

  public static function is_dev_mode(): bool {
    if (self::$dev_mode_cache !== null) {
      return self::$dev_mode_cache;
    }

    // Manual override via .dev file
    if (file_exists(OPENICON_PLUGIN_DIR . '.dev')) {
      $config = self::get_dev_config();
      $working_host = self::try_hosts($config['port'], 0.5);
      if ($working_host) {
        self::$working_dev_host = $working_host;
        $health = self::probe_dev_health($working_host);
        if ($health['ok']) {
          self::$working_dev_host = $working_host;
        }
      }
      $result = (bool) apply_filters('openicon_is_dev_mode', true, ['reason' => 'dot_dev_flag']);
      self::$dev_mode_cache = $result;
      return $result;
    }

    // Auto-detect: check port, then verify health endpoint
    $config = self::get_dev_config();
    $working_host = self::try_hosts($config['port']);

    if (! $working_host) {
      $result = (bool) apply_filters('openicon_is_dev_mode', false, ['reason' => 'port_closed']);
      self::$dev_mode_cache = $result;
      return $result;
    }

    $health = self::probe_dev_health($working_host);
    if ($health['ok']) {
      self::$working_dev_host = $working_host;
    }

    $result = (bool) apply_filters('openicon_is_dev_mode', $health['ok'], [
      'reason' => $health['ok'] ? 'health_check_passed' : 'health_check_failed',
      'error' => $health['error'] ?? null,
    ]);

    self::$dev_mode_cache = $result;
    return $result;
  }

  public static function get_vite_server_url(): string {
    return self::build_dev_server_url();
  }

  private static function collect_css_from_manifest(array $manifest, string $entry_key, array &$collected = [], array &$visited = []): array {
    if (isset($visited[$entry_key])) {
      return $collected;
    }
    $visited[$entry_key] = true;

    $entry = $manifest[$entry_key] ?? null;
    if (! is_array($entry)) {
      return $collected;
    }

    if (! empty($entry['css']) && is_array($entry['css'])) {
      foreach ($entry['css'] as $css_file) {
        if (! in_array($css_file, $collected, true)) {
          $collected[] = $css_file;
        }
      }
    }

    if (! empty($entry['imports']) && is_array($entry['imports'])) {
      foreach ($entry['imports'] as $import_key) {
        self::collect_css_from_manifest($manifest, $import_key, $collected, $visited);
      }
    }

    return $collected;
  }

  private static function ensure_module_script_filter(): void {
    if (self::$module_script_filters_added) {
      return;
    }

    add_filter('script_loader_tag', function ($tag, $handle) {
      if (in_array($handle, ['openicon-picker', 'openicon-settings', 'openicon-vite-client'], true)) {
        $tag = preg_replace('/type=["\'][^"\']*["\']\s*/', '', $tag);
        return str_replace('<script ', '<script type="module" ', $tag);
      }
      return $tag;
    }, 10, 2);

    self::$module_script_filters_added = true;
  }

  private static function enqueue_vite_client_with_preamble(): void {
    $vite_url = self::get_vite_server_url();

    wp_register_script('openicon-vite-client', $vite_url . '/@vite/client', [], (string) time(), false);
    self::ensure_module_script_filter();

    $preamble = 'import RefreshRuntime from "' . esc_url($vite_url) . '/@react-refresh";'
      . 'RefreshRuntime.injectIntoGlobalHook(window);'
      . 'window.$RefreshReg$ = () => {};'
      . 'window.$RefreshSig$ = () => (type) => type;'
      . 'window.__vite_plugin_react_preamble_installed__ = true;';
    wp_add_inline_script('openicon-vite-client', $preamble, 'before');
    wp_enqueue_script('openicon-vite-client');
  }

  public static function enqueue_picker_assets(): void {
    $settings = (new Settings(new Providers()))->get_settings();
    $provider = 'heroicons';

    $libraryUrl = 'https://heroicons.com';

    if (self::is_dev_mode()) {
      self::enqueue_vite_client_with_preamble();

      wp_enqueue_script(
        'openicon-picker',
        self::get_vite_server_url() . '/src/picker.tsx',
        ['openicon-vite-client'],
        time(),
        true
      );

      self::ensure_module_script_filter();

      $palette  = isset($settings['palette']) && is_array($settings['palette']) ? array_values($settings['palette']) : [];
      $defaultToken = $settings['defaultToken'] ?? 'A';

      wp_localize_script('openicon-picker', 'openicon_api', [
        'root' => esc_url_raw(rest_url()),
        'nonce' => wp_create_nonce('wp_rest'),
      ]);

      wp_add_inline_script('openicon-picker', 'window.__OPENICON_PALETTE__ = ' . wp_json_encode(['items' => $palette, 'default' => $defaultToken]) . '; window.__OPENICON_LIBRARY__ = { url: ' . wp_json_encode($libraryUrl) . ', name: "Heroicons" }; window.__OPENICON_LITE__ = true;', 'before');
    } else {
      $manifest_path = OPENICON_PLUGIN_DIR . 'assets/build/manifest.json';
      $manifest = [];

      if (! file_exists($manifest_path)) {
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

      $all_css = self::collect_css_from_manifest($manifest, 'src/picker.tsx');

      foreach (array_unique($all_css) as $idx => $css_file) {
        $handle = $idx === 0 ? 'openicon-picker' : 'openicon-picker-' . ($idx + 1);
        $css_url = OPENICON_PLUGIN_URL . 'assets/build/' . ltrim($css_file, '/');
        wp_enqueue_style($handle, $css_url, [], OPENICON_VERSION);
      }

      $js_url = OPENICON_PLUGIN_URL . 'assets/build/' . ltrim($entry['file'], '/');
      wp_register_script('openicon-picker', $js_url, [], OPENICON_VERSION, true);
      self::ensure_module_script_filter();

      $settings = (new Settings(new Providers()))->get_settings();
      $palette  = isset($settings['palette']) && is_array($settings['palette']) ? array_values($settings['palette']) : [];
      $defaultToken = $settings['defaultToken'] ?? 'A';

      wp_localize_script('openicon-picker', 'openicon_api', [
        'root' => esc_url_raw(rest_url()),
        'nonce' => wp_create_nonce('wp_rest'),
      ]);

      wp_add_inline_script('openicon-picker', 'window.__OPENICON_PALETTE__ = ' . wp_json_encode(['items' => $palette, 'default' => $defaultToken]) . '; window.__OPENICON_LIBRARY__ = { url: ' . wp_json_encode($libraryUrl) . ', name: "Heroicons" }; window.__OPENICON_LITE__ = true;', 'before');
      wp_enqueue_script('openicon-picker');
    }
  }

  public static function enqueue_settings_assets(): void {
    $settings = (new Settings(new Providers()))->get_settings();
    $palette  = isset($settings['palette']) && is_array($settings['palette']) ? array_values($settings['palette']) : [];
    $defaultToken = $settings['defaultToken'] ?? 'A';
    $libraryUrl = 'https://heroicons.com';

    if (self::is_dev_mode()) {
      self::enqueue_vite_client_with_preamble();
      wp_enqueue_script(
        'openicon-settings',
        self::get_vite_server_url() . '/src/settings.tsx',
        ['openicon-vite-client'],
        time(),
        true
      );
      self::ensure_module_script_filter();

      wp_localize_script('openicon-settings', 'openicon_api', [
        'root' => esc_url_raw(rest_url()),
        'nonce' => wp_create_nonce('wp_rest'),
      ]);

      wp_add_inline_script('openicon-settings', 'window.__OPENICON_PALETTE__ = ' . wp_json_encode(['items' => $palette, 'default' => $defaultToken]) . '; window.__OPENICON_LIBRARY__ = { url: ' . wp_json_encode($libraryUrl) . ', name: "Heroicons" }; window.__OPENICON_LITE__ = true; window.__OPENICON_SETTINGS__ = ' . wp_json_encode($settings) . ';', 'before');
    } else {
      $manifest_path = OPENICON_PLUGIN_DIR . 'assets/build/manifest.json';
      $manifest = [];

      if (! file_exists($manifest_path)) {
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

      $all_css = self::collect_css_from_manifest($manifest, 'src/settings.tsx');

      foreach (array_unique($all_css) as $idx => $css_file) {
        $handle = $idx === 0 ? 'openicon-settings' : 'openicon-settings-' . ($idx + 1);
        $css_url = OPENICON_PLUGIN_URL . 'assets/build/' . ltrim($css_file, '/');
        wp_enqueue_style($handle, $css_url, [], OPENICON_VERSION);
      }

      $js_url = OPENICON_PLUGIN_URL . 'assets/build/' . ltrim($entry['file'], '/');
      wp_register_script('openicon-settings', $js_url, [], OPENICON_VERSION, true);
      self::ensure_module_script_filter();

      wp_localize_script('openicon-settings', 'openicon_api', [
        'root' => esc_url_raw(rest_url()),
        'nonce' => wp_create_nonce('wp_rest'),
      ]);

      wp_add_inline_script('openicon-settings', 'window.__OPENICON_PALETTE__ = ' . wp_json_encode(['items' => $palette, 'default' => $defaultToken]) . '; window.__OPENICON_LIBRARY__ = { url: ' . wp_json_encode($libraryUrl) . ', name: "Heroicons" }; window.__OPENICON_LITE__ = true; window.__OPENICON_SETTINGS__ = ' . wp_json_encode($settings) . ';', 'before');
      wp_enqueue_script('openicon-settings');
    }
  }
}
