<?php

namespace ACFOI;

if (! defined('ABSPATH')) {
  exit;
}

class Rest {
  private $providers;
  private $cache;
  private $ns = 'acf-open-icons/v1';

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
        return current_user_can('manage_options') && check_ajax_referer('acfoi_admin', false, false);
      },
    ]);
  }

  public function get_icon(\WP_REST_Request $req) {
    $provider = sanitize_key((string) $req->get_param('provider'));
    $version  = sanitize_text_field((string) $req->get_param('version'));
    $key      = sanitize_title_with_dashes((string) $req->get_param('key'));

    if (! $this->providers->get($provider) || empty($key)) {
      return new \WP_Error('acfoi_bad_request', __('Invalid provider or key.', 'acf-open-icons'), ['status' => 400]);
    }
    $svg = $this->cache->get_svg($provider, $version ?: 'latest', $key);
    if (! $svg) {
      return new \WP_Error('acfoi_not_found', __('Icon not found.', 'acf-open-icons'), ['status' => 404]);
    }

    status_header(200);
    header('Content-Type: image/svg+xml; charset=UTF-8');
    header('Cache-Control: public, max-age=31536000');
    echo $svg;
    exit;
  }

  public function get_manifest(\WP_REST_Request $req) {
    $provider = sanitize_key((string) $req->get_param('provider'));
    $version  = sanitize_text_field((string) $req->get_param('version')) ?: 'latest';
    $search  = sanitize_text_field((string) $req->get_param('q'));

    $cache_key = 'acfoi_manifest_' . md5($provider . '|' . $version);
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

    // Return all icons (no limit - frontend handles virtual scrolling)
    return ['icons' => $icons];
  }

  private function fetch_manifest(string $provider, string $version): array {
    $icons = [];

    if ($provider === 'lucide') {
      $meta_url = 'https://unpkg.com/lucide-static@' . rawurlencode($version) . '/icons/?meta';
      $response = wp_remote_get($meta_url, ['timeout' => 20]);
      if (! is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        if (isset($data['files']) && is_array($data['files'])) {
          foreach ($data['files'] as $file) {
            if (isset($file['path']) && substr($file['path'], -4) === '.svg') {
              $icons[] = basename($file['path'], '.svg');
            }
          }
        }
      }
    } elseif ($provider === 'tabler') {
      // Tabler uses a different endpoint - fetch from unpkg meta
      $meta_url = 'https://unpkg.com/@tabler/icons@' . rawurlencode($version) . '/icons/?meta';
      $response = wp_remote_get($meta_url, ['timeout' => 20]);
      if (! is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        if (isset($data['files']) && is_array($data['files'])) {
          foreach ($data['files'] as $file) {
            if (isset($file['path']) && substr($file['path'], -4) === '.svg') {
              $icons[] = basename($file['path'], '.svg');
            }
          }
        }
      }
    } elseif ($provider === 'heroicons') {
      // Heroicons has separate outline/solid collections
      // For now, fetch all from the 24/outline directory
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
    $start_time = microtime(true);
    $provider = sanitize_key((string) $req->get_param('provider'));
    $version  = sanitize_text_field((string) $req->get_param('version')) ?: 'latest';
    $keys     = (string) $req->get_param('keys');
    $keys_arr = array_filter(array_map('sanitize_title_with_dashes', explode(',', $keys)));

    $out = [];
    $cache_hits = 0;
    $cache_misses = [];

    // First, check cache for all icons
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
          $cache_hits++;
        }
      } else {
        $cache_misses[] = $k;
      }
    }

    // Fetch missing icons in parallel
    $fetched_count = 0;
    if (! empty($cache_misses)) {
      $fetched = $this->cache->fetch_multiple_and_store($provider, $version, $cache_misses);
      $fetched_count = count($fetched);
      foreach ($fetched as $k => $svg) {
        $out[] = ['key' => $k, 'svg' => $svg];
      }
    }

    // Return bundle response

    return ['items' => $out];
  }

  public function purge_cache(\WP_REST_Request $req) {
    $provider = sanitize_key((string) $req->get_param('provider'));
    $version  = sanitize_text_field((string) $req->get_param('version'));
    if (! $this->providers->get($provider) || ! $version) {
      return new \WP_Error('acfoi_bad_request', __('Invalid provider or version.', 'acf-open-icons'), ['status' => 400]);
    }
    $this->cache->purge($provider, $version);
    return ['ok' => true];
  }
}
