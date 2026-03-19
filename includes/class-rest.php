<?php

namespace OPENICON;

if (! defined('ABSPATH')) {
  exit;
}

/**
 * REST API endpoints for ACF Open Icons Lite.
 * All icons are bundled locally — no remote fetching.
 */
class Rest {
  private $providers;
  private $cache;
  private $ns = 'openicon/v1';

  public function __construct(Providers $providers, Cache $cache) {
    $this->providers = $providers;
    $this->cache     = $cache;
    add_action('rest_api_init', [$this, 'register']);
  }

  public function register(): void {
    register_rest_route($this->ns, '/icon', [
      'methods'  => 'GET',
      'callback' => [$this, 'get_icon'],
      'permission_callback' => function () {
        return current_user_can('edit_posts');
      },
    ]);

    register_rest_route($this->ns, '/manifest', [
      'methods'  => 'GET',
      'callback' => [$this, 'get_manifest'],
      'permission_callback' => function () {
        return current_user_can('edit_posts');
      },
    ]);

    register_rest_route($this->ns, '/bundle', [
      'methods'  => 'GET',
      'callback' => [$this, 'get_bundle'],
      'permission_callback' => function () {
        return current_user_can('edit_posts');
      },
    ]);

    register_rest_route($this->ns, '/settings', [
      'methods'  => 'POST',
      'callback' => [$this, 'save_settings'],
      'permission_callback' => function () {
        return current_user_can('manage_options');
      },
    ]);

    register_rest_route($this->ns, '/settings/restore', [
      'methods'  => 'POST',
      'callback' => [$this, 'restore_defaults'],
      'permission_callback' => function () {
        return current_user_can('manage_options');
      },
    ]);
  }

  public function get_icon(\WP_REST_Request $req) {
    $provider = sanitize_key((string) $req->get_param('provider'));
    $version  = sanitize_text_field((string) $req->get_param('version'));
    $key      = $this->sanitize_icon_key((string) $req->get_param('key'));

    if ($provider !== 'heroicons') {
      $provider = 'heroicons';
    }

    if (! $this->providers->get($provider) || empty($key)) {
      return new \WP_Error('openicon_bad_request', __('Invalid provider or key.', 'open-icons-acf'), ['status' => 400]);
    }

    $svg = $this->cache->get_svg($provider, $version ?: 'latest', $key);
    if (! $svg) {
      return new \WP_Error('openicon_not_found', __('Icon not found.', 'open-icons-acf'), ['status' => 404]);
    }

    status_header(200);
    header('Content-Type: image/svg+xml; charset=UTF-8');
    header('Cache-Control: public, max-age=31536000');
    echo wp_kses($svg, openicon_get_allowed_svg_tags());
    exit;
  }

  private function sanitize_icon_key(string $key): string {
    $key = str_replace(["\0", "\r", "\n"], '', $key);
    $key = str_replace(['..', '/', '\\'], '', $key);
    $key = trim($key);
    return $key;
  }

  public function get_manifest(\WP_REST_Request $req) {
    $search = sanitize_text_field((string) $req->get_param('q'));
    $icons  = $this->cache->get_manifest();

    if ($search) {
      $icons = array_values(array_filter($icons, function ($k) use ($search) {
        return strpos($k, $search) !== false;
      }));
    }

    return ['icons' => $icons];
  }

  public function get_bundle(\WP_REST_Request $req) {
    $provider = sanitize_key((string) $req->get_param('provider'));
    $version  = sanitize_text_field((string) $req->get_param('version')) ?: 'latest';
    $keys     = (string) $req->get_param('keys');
    $keys_arr = array_filter(array_map([$this, 'sanitize_icon_key'], explode(',', $keys)));

    if ($provider !== 'heroicons') {
      $provider = 'heroicons';
    }

    $out = [];
    foreach ($keys_arr as $k) {
      $svg = $this->cache->get_svg($provider, $version, $k);
      if ($svg) {
        $out[] = ['key' => $k, 'svg' => $svg];
      }
    }

    return ['items' => $out];
  }

  /**
   * Save settings via REST.
   */
  public function save_settings(\WP_REST_Request $req) {
    $input = $req->get_json_params();

    if (! is_array($input)) {
      return new \WP_Error('openicon_bad_request', __('Invalid settings data.', 'open-icons-acf'), ['status' => 400]);
    }

    $settings = [];

    $settings['activeProvider'] = 'heroicons';

    if (isset($input['palette']) && is_array($input['palette'])) {
      $palette = [];
      foreach (array_slice($input['palette'], 0, 3) as $item) {
        if (! is_array($item)) {
          continue;
        }
        $palette[] = [
          'label' => sanitize_text_field($item['label'] ?? ''),
          'hex'   => sanitize_hex_color($item['hex'] ?? '') ?: '#000000',
          'token' => in_array($item['token'] ?? '', ['A', 'B', 'C'], true) ? $item['token'] : '',
        ];
      }
      $settings['palette'] = $palette;
    }

    $settings['defaultToken'] = in_array($input['defaultToken'] ?? '', ['A', 'B', 'C'], true)
      ? $input['defaultToken']
      : 'A';

    update_option('openicon_settings', $settings);

    return [
      'success'  => true,
      'settings' => $settings,
    ];
  }

  /**
   * Restore default settings via REST.
   */
  public function restore_defaults(\WP_REST_Request $req) {
    delete_option('openicon_settings');

    $defaults = [
      'activeProvider' => 'heroicons',
      'palette'        => [
        ['token' => 'A', 'label' => 'Primary', 'hex' => '#18181b'],
        ['token' => 'B', 'label' => 'Secondary', 'hex' => '#71717a'],
        ['token' => 'C', 'label' => 'Accent', 'hex' => '#4f46e5'],
      ],
      'defaultToken'   => 'A',
    ];

    return [
      'success' => true,
      'settings' => $defaults,
    ];
  }
}
