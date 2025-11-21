<?php

namespace ACFOI;

if (! defined('ABSPATH')) {
  exit;
}

class Update_Checker {
  private $server_url;
  private $plugin_slug = 'acf-open-icons';
  private $plugin_file;

  public function __construct() {
    $this->plugin_file = ACFOI_PLUGIN_FILE;
    $this->server_url = apply_filters(
      'acfoi_licensing_server_url',
      defined('ACFOI_LICENSING_SERVER_URL') ? ACFOI_LICENSING_SERVER_URL : 'https://acf-open-icons-licensing.vercel.app'
    );

    // Hook into WordPress update system
    add_filter('pre_set_site_transient_update_plugins', [$this, 'check_for_updates_transient'], 10, 1);
    add_filter('plugins_api', [$this, 'plugin_api_call'], 20, 3);
    add_filter('upgrader_post_install', [$this, 'post_install'], 10, 3);
    // Block download if license is not valid (safety net - proxy endpoint handles validation)
    add_filter('upgrader_pre_download', [$this, 'block_download_if_unauthorized'], 10, 3);
    // Handle update failures and ensure maintenance mode is cleaned up
    add_action('upgrader_process_complete', [$this, 'handle_update_complete'], 10, 2);
    // Clean up maintenance mode if update fails
    add_action('admin_footer', [$this, 'cleanup_maintenance_mode_on_error']);
  }

  /**
   * Check for updates
   */
  public function check_for_updates(): array {
    $current_version = $this->get_plugin_version();
    $licence = new Licence();
    $license_data = $licence->get_status();
    $license_key = $license_data['license_key'] ?? '';

    $url = trailingslashit($this->server_url) . 'api/update-check';
    $url = add_query_arg([
      'version' => $current_version,
      'license_key' => $license_key,
    ], $url);

    $response = wp_remote_get($url, [
      'timeout' => 15,
    ]);

    if (is_wp_error($response)) {
      return [
        'update_available' => false,
        'error' => $response->get_error_message(),
      ];
    }

    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    if (! $data || ! isset($data['update_available'])) {
      return [
        'update_available' => false,
      ];
    }

    return $data;
  }

  /**
   * Hook into WordPress update system
   */
  public function check_for_updates_transient($transient) {
    if (empty($transient->checked)) {
      return $transient;
    }

    $update_info = $this->check_for_updates();

    if (! $update_info['update_available']) {
      return $transient;
    }

    // Always show the update - proxy endpoint handles license validation
    $plugin_file = plugin_basename($this->plugin_file);
    $obj = new \stdClass();
    $obj->slug = $this->plugin_slug;
    $obj->plugin = $plugin_file;
    $obj->new_version = $update_info['latest_version'];
    $obj->url = '';
    // Always provide download URL - proxy endpoint validates license before streaming
    $obj->package = $update_info['download_url'] ?? '';
    $obj->tested = '';
    $obj->requires_php = '';

    $transient->response[$plugin_file] = $obj;

    return $transient;
  }

  /**
   * Plugin API call for update details
   */
  public function plugin_api_call($result, $action, $args) {
    if ($action !== 'plugin_information' || $args->slug !== $this->plugin_slug) {
      return $result;
    }

    $update_info = $this->check_for_updates();

    if (! $update_info['update_available']) {
      return $result;
    }

    $res = new \stdClass();
    $res->name = 'ACF Open Icons';
    $res->slug = $this->plugin_slug;
    $res->version = $update_info['latest_version'];
    $res->tested = '';
    $res->requires = '';
    $res->author = 'David O\'Sullivan';
    $res->author_profile = 'https://osull.io';
    $res->download_link = $update_info['download_url'] ?? '';
    $res->trunk = $update_info['download_url'] ?? '';
    $res->requires_php = '';
    $res->last_updated = '';
    $res->sections = [
      'changelog' => $update_info['changelog'] ?? __('Changelog will be included from the next release.', 'acf-open-icons'),
    ];
    $res->banners = [];
    $res->icons = [];

    return $res;
  }

  /**
   * Post install hook
   */
  public function post_install($response, $hook_extra, $result) {
    if (isset($hook_extra['plugin']) && $hook_extra['plugin'] === plugin_basename($this->plugin_file)) {
      // Clear any caches
      delete_transient('acfoi_update_check');
    }
    return $response;
  }

  /**
   * Block download if package is empty (safety net for edge cases)
   * Proxy endpoint handles license validation, but this catches empty package scenarios
   */
  public function block_download_if_unauthorized($reply, $package, $upgrader) {
    // Only process our plugin
    $plugin_file = plugin_basename($this->plugin_file);

    // Check if this is our plugin being updated
    $is_our_plugin = false;

    // Check various ways WordPress might identify the plugin
    if (isset($upgrader->skin->plugin) && $upgrader->skin->plugin === $plugin_file) {
      $is_our_plugin = true;
    } elseif (isset($upgrader->skin->plugin_info['plugin']) &&
              $upgrader->skin->plugin_info['plugin'] === $plugin_file) {
      $is_our_plugin = true;
    } elseif (isset($upgrader->skin->plugin_active) &&
              $upgrader->skin->plugin_active === $plugin_file) {
      $is_our_plugin = true;
    } elseif (empty($package) && isset($upgrader->skin->plugin_info)) {
      // If package is empty and we're in plugin update context, check if it's our plugin
      $plugin_info = $upgrader->skin->plugin_info;
      if (isset($plugin_info['slug']) && $plugin_info['slug'] === $this->plugin_slug) {
        $is_our_plugin = true;
      }
    }

    if (! $is_our_plugin) {
      return $reply;
    }

    // Only block if package is empty (edge case - proxy endpoint should always provide URL)
    if (empty($package)) {
      $licence = new Licence();
      $license_data = $licence->get_status();
      $has_license_key = ! empty($license_data['license_key']);

      $error_message = $has_license_key
        ? __('Unable to download update. Please check your license status in the plugin settings or try again later.', 'acf-open-icons')
        : __('An active license is required to download updates. Please activate your license in the plugin settings.', 'acf-open-icons');

      return new \WP_Error(
        'acfoi_unauthorized',
        $error_message
      );
    }

    // Proxy endpoint handles license validation, so we don't need to check here
    return $reply;
  }

  /**
   * Handle update completion (success or failure)
   * Ensures maintenance mode is cleaned up and caches are cleared
   */
  public function handle_update_complete($upgrader, $hook_extra) {
    // Only process our plugin
    $plugin_file = plugin_basename($this->plugin_file);

    if (! isset($hook_extra['plugin']) || $hook_extra['plugin'] !== $plugin_file) {
      return;
    }

    // Clear update check cache
    delete_transient('acfoi_update_check');

    // Ensure maintenance mode is cleaned up
    $this->cleanup_maintenance_file();
  }

  /**
   * Clean up maintenance mode file if it exists
   * WordPress should handle this automatically, but we ensure it's cleaned up
   * in case of errors or edge cases
   */
  private function cleanup_maintenance_file() {
    $maintenance_file = ABSPATH . '.maintenance';

    if (file_exists($maintenance_file)) {
      // Check if maintenance mode is stale (older than 10 minutes)
      // WordPress should clean it up automatically, but if it's stale, remove it
      $file_time = filemtime($maintenance_file);
      $current_time = time();

      // If maintenance file is older than 10 minutes, it's likely stale
      if (($current_time - $file_time) > 600) {
        @unlink($maintenance_file);
      }
    }
  }

  /**
   * Clean up maintenance mode on error (called in admin footer)
   * This is a safety net in case WordPress doesn't clean up maintenance mode
   */
  public function cleanup_maintenance_mode_on_error() {
    // Only run on plugin update pages
    if (! isset($_GET['action']) || $_GET['action'] !== 'upgrade-plugin') {
      return;
    }

    // Check if we're updating our plugin
    if (! isset($_GET['plugin']) || $_GET['plugin'] !== plugin_basename($this->plugin_file)) {
      return;
    }

    // If we're on the plugins page after an update attempt, check for stale maintenance file
    if (isset($_GET['updated']) || isset($_GET['error'])) {
      $this->cleanup_maintenance_file();
    }
  }

  /**
   * Get plugin version
   */
  private function get_plugin_version(): string {
    if (! function_exists('get_plugin_data')) {
      require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }
    $plugin_data = get_plugin_data($this->plugin_file);
    return $plugin_data['Version'] ?? '0.3.0';
  }
}

