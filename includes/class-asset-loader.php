<?php

namespace ACFOI;

if (! defined('ABSPATH')) {
  exit;
}

class Asset_Loader {

  public static function is_dev_mode(): bool {
    if (file_exists(ACFOI_PLUGIN_DIR . '.dev')) {
      return true;
    }
    $vite_url = self::get_vite_server_url();
    $vite_check = wp_remote_get($vite_url . '/@vite/client', ['timeout' => 1]);
    return ! is_wp_error($vite_check) && wp_remote_retrieve_response_code($vite_check) === 200;
  }

  public static function get_vite_server_url(): string {
    return 'http://localhost:5173';
  }

  private static function enqueue_vite_client_with_preamble(): void {
    $vite_url = self::get_vite_server_url();

    // Register vite client as a handle so other scripts can depend on it
    wp_register_script('abi-vite-client', $vite_url . '/@vite/client', [], null, false);

    // Force type=module for the vite client
    add_filter('script_loader_tag', function ($tag, $handle) {
      if ($handle === 'abi-vite-client') {
        return str_replace('<script ', '<script type="module" ', $tag);
      }
      return $tag;
    }, 10, 2);

    // Inject preamble BEFORE vite client so plugin-react detects it (escape $ variables)
    $preamble_tpl = <<<'JS'
import RefreshRuntime from '%VITE_URL%/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;
JS;
    $preamble = str_replace('%VITE_URL%', esc_url($vite_url), $preamble_tpl);
    wp_add_inline_script('abi-vite-client', $preamble, 'before');
    wp_enqueue_script('abi-vite-client');
  }

  public static function enqueue_picker_assets(): void {
    // Get common icons for the active provider
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

    // Extract icons array and library URL
    $common = $manifestData['icons'] ?? [];
    $libraryUrl = $manifestData['library'] ?? 'https://lucide.dev/icons';

    // Debug: Log what provider we're loading
    error_log('[ACFOI] Loading provider: ' . $provider . ' with ' . count($common) . ' common icons from ' . $path);

    if (self::is_dev_mode()) {
      // Development: ensure vite client + preamble are loaded first
      self::enqueue_vite_client_with_preamble();

      // Enqueue the main entry point with dependency on client
      wp_enqueue_script(
        'abi-picker',
        self::get_vite_server_url() . '/src/picker.tsx',
        ['abi-vite-client'],
        time(),
        true
      );

      // Mark as module
      add_filter('script_loader_tag', function ($tag, $handle) {
        if ($handle === 'abi-picker') {
          // Clean up any existing type attribute and add correct one
          $tag = preg_replace('/type=["\'][^"\']*["\']\s*/', '', $tag);
          return str_replace('<script ', '<script type="module" ', $tag);
        }
        return $tag;
      }, 10, 2);

      // Add inline BEFORE the module script
      add_action('admin_footer', function () use ($common, $libraryUrl, $provider) {
        $settings = (new Settings(new Providers(), new Cache(new Providers(), new Sanitiser())))->get_settings();
        $palette  = isset($settings['palette']) && is_array($settings['palette']) ? array_values($settings['palette']) : [];
        $defaultToken = $settings['defaultToken'] ?? 'A';
        $providers = (new Providers())->all();
        $providerLabel = $providers[$provider]['label'] ?? 'Lucide';
        error_log('[ACFOI] Injecting library info: ' . $providerLabel . ' at ' . $libraryUrl . ' with ' . count($common) . ' common icons');
        echo '<script>window.__ACFOI_COMMON__ = ' . wp_json_encode(array_values($common)) . '; window.__ACFOI_PALETTE__ = ' . wp_json_encode(['items' => $palette, 'default' => $defaultToken]) . '; window.__ACFOI_LIBRARY__ = { url: ' . wp_json_encode($libraryUrl) . ', name: ' . wp_json_encode($providerLabel) . ' };</script>' . "\n";
      }, 5);
    } else {
      $js_url = ACFOI_PLUGIN_URL . 'assets/build/picker.js';
      wp_register_script('abi-picker', $js_url, [], '0.1.0', true);
      wp_add_inline_script('abi-picker', 'window.__ACFOI_COMMON__ = ' . wp_json_encode(array_values($common)) . ';', 'before');
      wp_enqueue_script('abi-picker');

      $manifest_path = ACFOI_PLUGIN_DIR . 'assets/build/.vite/manifest.json';
      if (file_exists($manifest_path)) {
        $manifest = json_decode(file_get_contents($manifest_path), true);
        if (isset($manifest['src/picker.tsx']['css'])) {
          foreach ($manifest['src/picker.tsx']['css'] as $css_file) {
            wp_enqueue_style('abi-picker', ACFOI_PLUGIN_URL . 'assets/build/' . $css_file, [], '0.1.0');
          }
        }
      }
    }
  }

  public static function enqueue_settings_assets(): void {
    // Localise palette for settings UI as well
    $settings = (new Settings(new Providers(), new Cache(new Providers(), new Sanitiser())))->get_settings();
    $palette  = isset($settings['palette']) && is_array($settings['palette']) ? array_values($settings['palette']) : [];
    $defaultToken = $settings['defaultToken'] ?? 'A';

    if (self::is_dev_mode()) {
      self::enqueue_vite_client_with_preamble();
      wp_enqueue_script(
        'abi-settings',
        self::get_vite_server_url() . '/src/settings.tsx',
        ['abi-vite-client'],
        time(),
        true
      );
      add_filter('script_loader_tag', function ($tag, $handle) {
        if ($handle === 'abi-settings') {
          $tag = preg_replace('/type=["\'][^"\']*["\']\s*/', '', $tag);
          return str_replace('<script ', '<script type="module" ', $tag);
        }
        return $tag;
      }, 10, 2);
      add_action('admin_footer', function () use ($palette, $defaultToken) {
        echo '<script>window.__ACFOI_PALETTE__ = ' . wp_json_encode(['items' => $palette, 'default' => $defaultToken]) . ';</script>' . "\n";
      }, 5);
    }
  }
}
