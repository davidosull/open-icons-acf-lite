<?php

namespace ACFOI;

if (! defined('ABSPATH')) {
  exit;
}

class Rest {
  private $providers;
  private $cache;
  private $migration;
  private $ns = 'acf-open-icons/v1';

  public function __construct(Providers $providers, Cache $cache) {
    $this->providers = $providers;
    $this->cache     = $cache;
    add_action('rest_api_init', [$this, 'register']);
    // Allow cookie authentication for our migration endpoints
    add_filter('rest_authentication_errors', [$this, 'handle_rest_authentication'], 10, 2);
  }

  /**
   * Handle REST API authentication errors for our endpoints.
   *
   * @param \WP_Error|null $result Authentication error or null
   * @param \WP_REST_Server|null $server REST server instance (may be null)
   * @return \WP_Error|null
   */
  public function handle_rest_authentication($result, $server = null) {
    // Get route from server if available, otherwise from request
    $route = '';
    if ($server instanceof \WP_REST_Server) {
      $route = $server->get_route();
    } elseif (isset($_SERVER['REQUEST_URI'])) {
      // Fallback: extract route from REQUEST_URI
      $request_uri = sanitize_text_field(wp_unslash($_SERVER['REQUEST_URI']));
      if (preg_match('#/wp-json/' . preg_quote($this->ns, '#') . '/migration/#', $request_uri)) {
        $route = $this->ns . '/migration/status'; // Approximate route
      }
    }

    // Only handle our migration endpoints
    if ($route && strpos($route, $this->ns . '/migration/') === 0) {
      // In REST API context, WordPress doesn't automatically load user from cookies
      // We need to manually validate the auth cookie and set the current user
      $cookie = '';
      if (isset($_COOKIE[LOGGED_IN_COOKIE])) {
        $cookie = $_COOKIE[LOGGED_IN_COOKIE];
      }

      if ($cookie) {
        $user_id = wp_validate_auth_cookie($cookie, 'logged_in');

        if ($user_id) {
          wp_set_current_user($user_id);
          if (current_user_can('manage_options')) {
            return null; // null means authentication passed
          }
        }
      }
    }

    return $result; // Let WordPress handle other routes normally
  }

  public function set_migration(Migration $migration): void {
    $this->migration = $migration;
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

    register_rest_route($this->ns, '/migration/status', [
      'methods'  => 'GET',
      'callback' => [$this, 'get_migration_status'],
      'permission_callback' => function (\WP_REST_Request $request) {
        // WordPress REST API uses cookie authentication for logged-in users
        // For GET requests, cookie authentication is sufficient
        // Nonce is optional for GET requests when user is authenticated via cookies
        if (! is_user_logged_in()) {
          return false;
        }

        if (! current_user_can('manage_options')) {
          return false;
        }

        // For GET requests, cookie authentication is sufficient
        // Nonce verification is optional (WordPress REST API handles this automatically)
        return true;
      },
    ]);

    register_rest_route($this->ns, '/migration/migrate-icon', [
      'methods'  => 'POST',
      'callback' => [$this, 'migrate_icon'],
      'permission_callback' => function () {
        return current_user_can('manage_options');
      },
    ]);

    // License endpoints
    register_rest_route($this->ns, '/license', [
      'methods'  => 'GET',
      'callback' => [$this, 'get_license'],
      'permission_callback' => function () {
        return current_user_can('manage_options');
      },
    ]);

    register_rest_route($this->ns, '/license/activate', [
      'methods'  => 'POST',
      'callback' => [$this, 'activate_license'],
      'permission_callback' => function () {
        return current_user_can('manage_options');
      },
    ]);

    register_rest_route($this->ns, '/license/deactivate', [
      'methods'  => 'POST',
      'callback' => [$this, 'deactivate_license'],
      'permission_callback' => function () {
        return current_user_can('manage_options');
      },
    ]);

    register_rest_route($this->ns, '/license/check-update', [
      'methods'  => 'GET',
      'callback' => [$this, 'check_update'],
      'permission_callback' => function () {
        return current_user_can('manage_options');
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

  public function fetch_manifest(string $provider, string $version): array {
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

  /**
   * Get migration status.
   *
   * @param \WP_REST_Request $req Request object
   * @return array|\WP_Error Migration status or error
   */
  public function get_migration_status(\WP_REST_Request $req) {
    if (! $this->migration) {
      return new \WP_Error('acfoi_not_available', __('Migration service not available.', 'acf-open-icons'), ['status' => 500]);
    }

    // Get provider from request parameter (for preview) or from settings
    $provider_param = sanitize_key((string) $req->get_param('provider'));

    if (! empty($provider_param) && $this->providers->get($provider_param)) {
      $current_provider = $provider_param;
    } else {
      $settings = get_option('acf_open_icons_settings', []);
      $current_provider = $settings['activeProvider'] ?? 'lucide';
    }

    // Get migration status
    $status = $this->migration->get_migration_status($current_provider);

    // Group non-current icons by iconKey for easier frontend handling
    $grouped_by_icon = [];
    foreach ($status['non_current'] as $icon) {
      $icon_key = $icon['value']['iconKey'] ?? 'unknown';
      if (! isset($grouped_by_icon[$icon_key])) {
        $grouped_by_icon[$icon_key] = [];
      }
      $grouped_by_icon[$icon_key][] = $icon;
    }

    $result = [
      'current_provider' => $current_provider,
      'by_provider' => $status['by_provider'],
      'non_current' => $status['non_current'],
      'grouped_by_icon' => $grouped_by_icon,
      'total' => $status['total'],
    ];

    return $result;
  }

  /**
   * Migrate a single icon.
   *
   * @param \WP_REST_Request $req Request object
   * @return array|\WP_Error Migration result or error
   */
  public function migrate_icon(\WP_REST_Request $req) {
    if (! $this->migration) {
      return new \WP_Error('acfoi_not_available', __('Migration service not available.', 'acf-open-icons'), ['status' => 500]);
    }

    $old_icon_key = sanitize_title_with_dashes((string) $req->get_param('oldIconKey'));
    $new_icon_key = sanitize_title_with_dashes((string) $req->get_param('newIconKey'));
    $new_provider = sanitize_key((string) $req->get_param('newProvider'));
    $new_version  = sanitize_text_field((string) $req->get_param('newVersion'));

    if (empty($old_icon_key) || empty($new_icon_key) || ! $this->providers->get($new_provider)) {
      return new \WP_Error('acfoi_bad_request', __('Invalid parameters.', 'acf-open-icons'), ['status' => 400]);
    }

    // Find all icons with the old iconKey AND from non-current provider
    // We need to filter by provider to avoid migrating icons that are already from the current provider
    $all_icons = $this->migration->find_all_icons();

    // Get current saved provider from settings
    $settings = (new \ACFOI\Settings(new \ACFOI\Providers(), new \ACFOI\Cache(new \ACFOI\Providers(), new \ACFOI\Sanitiser())))->get_settings();
    $current_saved_provider = $settings['activeProvider'] ?? 'lucide';

    // Filter icons: must match old iconKey AND be from a different provider than the new one
    // This prevents migrating icons that are already from the target provider
    $icons_to_migrate = array_filter($all_icons, function ($icon) use ($old_icon_key, $new_provider, $current_saved_provider) {
      $icon_key = $icon['value']['iconKey'] ?? '';
      $icon_provider = $icon['value']['provider'] ?? '';

      // Must match the old icon key
      if ($icon_key !== $old_icon_key) {
        return false;
      }

      // Must be from a provider that's different from the new provider
      // This ensures we only migrate icons that actually need migration
      return $icon_provider !== $new_provider;
    });

    if (empty($icons_to_migrate)) {
      return new \WP_Error('acfoi_not_found', __('No icons found to migrate.', 'acf-open-icons'), ['status' => 404]);
    }

    $migrated_count = 0;
    foreach ($icons_to_migrate as $icon) {
      // Update iconKey and provider/version
      $icon['value']['iconKey'] = $new_icon_key;
      $icon['value']['provider'] = $new_provider;
      $icon['value']['version'] = $new_version;

      // Update in database
      if ($this->migration->update_icon_value($icon, $new_provider, $new_version)) {
        $migrated_count++;
      }
    }

    return [
      'ok' => true,
      'migrated_count' => $migrated_count,
      'total_count' => count($icons_to_migrate),
    ];
  }

  /**
   * Get license status
   */
  public function get_license(\WP_REST_Request $req) {
    $licence = new Licence();
    $status = $licence->get_status();
    return $status;
  }

  /**
   * Activate license
   */
  public function activate_license(\WP_REST_Request $req) {
    $license_key = sanitize_text_field((string) $req->get_param('license_key'));

    if (empty($license_key)) {
      return new \WP_Error('acfoi_bad_request', __('License key is required.', 'acf-open-icons'), ['status' => 400]);
    }

    $licence = new Licence();
    $result = $licence->activate($license_key);

    if (! $result['success']) {
      return new \WP_Error('acfoi_activation_failed', $result['message'], ['status' => 400]);
    }

    // Clear update transient so WordPress immediately picks up any available updates
    // WordPress will show the update on the Plugins page automatically
    delete_site_transient('update_plugins');

    return [
      'success' => true,
      'message' => $result['message'],
      'license' => $result['license'] ?? null,
    ];
  }

  /**
   * Deactivate license
   */
  public function deactivate_license(\WP_REST_Request $req) {
    $licence = new Licence();
    $licence->deactivate();
    return ['success' => true, 'message' => __('License deactivated successfully.', 'acf-open-icons')];
  }

  /**
   * Check for updates
   */
  public function check_update(\WP_REST_Request $req) {
    $update_checker = new Update_Checker();
    return $update_checker->check_for_updates();
  }
}
