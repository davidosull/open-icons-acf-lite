<?php

namespace ACFOIL;

if (! defined('ABSPATH')) {
  exit;
}

class Rest {
  private $providers;
  private $cache;
  private $ns = 'acf-open-icons-lite/v1';

  public function __construct(Providers $providers, Cache $cache) {
    $this->providers = $providers;
    $this->cache     = $cache;
    add_action('rest_api_init', [$this, 'register']);
  }

  public function register(): void {
    register_rest_route($this->ns, '/icon', [
      'methods'  => 'GET',
      'callback' => [$this, 'get_icon'],
      'permission_callback' => '__return_true',
    ]);

    register_rest_route($this->ns, '/manifest', [
      'methods'  => 'GET',
      'callback' => [$this, 'get_manifest'],
      'permission_callback' => '__return_true',
    ]);

    register_rest_route($this->ns, '/bundle', [
      'methods'  => 'GET',
      'callback' => [$this, 'get_bundle'],
      'permission_callback' => '__return_true',
    ]);

    register_rest_route($this->ns, '/cache/purge', [
      'methods'  => 'POST',
      'callback' => [$this, 'purge_cache'],
      'permission_callback' => function () {
        return current_user_can('manage_options') && check_ajax_referer('acfoil_admin', false, false);
      },
    ]);
  }

  public function get_icon(\WP_REST_Request $req) {
    $provider = sanitize_key((string) $req->get_param('provider'));
    $version  = sanitize_text_field((string) $req->get_param('version'));
    $key      = $this->sanitize_icon_key((string) $req->get_param('key'));

    if (! $this->providers->get($provider) || empty($key)) {
      return new \WP_Error('acfoil_bad_request', __('Invalid provider or key.', 'acf-open-icons-lite'), ['status' => 400]);
    }

    $svg = $this->cache->get_svg($provider, $version ?: 'latest', $key);
    if (! $svg) {
      return new \WP_Error('acfoil_not_found', __('Icon not found.', 'acf-open-icons-lite'), ['status' => 404]);
    }

    status_header(200);
    header('Content-Type: image/svg+xml; charset=UTF-8');
    header('Cache-Control: public, max-age=31536000');
    echo $svg;
    exit;
  }

  private function sanitize_icon_key(string $key): string {
    $key = str_replace(["\0", "\r", "\n"], '', $key);
    $key = str_replace(['..', '/', '\\'], '', $key);
    return trim($key);
  }

  public function get_manifest(\WP_REST_Request $req) {
    $provider = sanitize_key((string) $req->get_param('provider'));
    $version  = sanitize_text_field((string) $req->get_param('version')) ?: 'latest';
    $search   = sanitize_text_field((string) $req->get_param('q'));

    $cache_key = 'acfoil_manifest_' . md5($provider . '|' . $version);
    $icons = get_transient($cache_key);

    if (! is_array($icons)) {
      $icons = $this->fetch_manifest($provider, $version);
      if (is_array($icons)) {
        set_transient($cache_key, $icons, HOUR_IN_SECONDS * 12);
      }
    }

    if ($search) {
      $icons = array_values(array_filter($icons, function ($k) use ($search) {
        return strpos($k, $search) !== false;
      }));
    }

    return ['icons' => $icons];
  }

  public function fetch_manifest(string $provider, string $version): array {
    $icons = [];

    if ($provider === 'heroicons') {
      $meta_url = 'https://unpkg.com/heroicons@' . rawurlencode($version) . '/?meta';
      $response = wp_remote_get($meta_url, ['timeout' => 20]);
      if (! is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        if (isset($data['files']) && is_array($data['files'])) {
          foreach ($data['files'] as $file) {
            if (isset($file['path']) && strpos($file['path'], '24/outline/') !== false && substr($file['path'], -4) === '.svg') {
              $icons[] = basename($file['path'], '.svg');
            }
          }
        }
      }
    }

    sort($icons, SORT_STRING);
    return $icons;
  }

  public function get_bundle(\WP_REST_Request $req) {
    $provider = sanitize_key((string) $req->get_param('provider'));
    $version  = sanitize_text_field((string) $req->get_param('version')) ?: 'latest';
    $keys     = (string) $req->get_param('keys');
    $keys_arr = array_filter(array_map([$this, 'sanitize_icon_key'], explode(',', $keys)));

    $out = [];
    $cache_misses = [];

    foreach ($keys_arr as $k) {
      $file = $this->cache->path_for($provider, $version, $k);
      if (file_exists($file)) {
        $svg = file_get_contents($file);
        if (strpos($svg, '\\"') !== false) {
          $svg = str_replace('\\"', '"', $svg);
          file_put_contents($file, $svg);
        }
        if ($svg) {
          $out[] = ['key' => $k, 'svg' => $svg];
        }
      } else {
        $cache_misses[] = $k;
      }
    }

    if (! empty($cache_misses)) {
      $fetched = $this->cache->fetch_multiple_and_store($provider, $version, $cache_misses);
      foreach ($fetched as $k => $svg) {
        $out[] = ['key' => $k, 'svg' => $svg];
      }
    }

    return ['items' => $out];
  }

  public function purge_cache(\WP_REST_Request $req) {
    $provider = sanitize_key((string) $req->get_param('provider'));
    $version  = sanitize_text_field((string) $req->get_param('version'));
    if (! $this->providers->get($provider) || ! $version) {
      return new \WP_Error('acfoil_bad_request', __('Invalid provider or version.', 'acf-open-icons-lite'), ['status' => 400]);
    }
    $this->cache->purge($provider, $version);
    return ['ok' => true];
  }
}
