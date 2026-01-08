<?php

/**
 * Plugin Name: ACF Open Icons Lite
 * Description: ACF field that lets you use the Heroicons icon set with caching, sanitisation, and stable rendering. Free version with 292+ icons.
 * Version: 1.0.0
 * Author: David O'Sullivan
 * Author URI: https://osull.io
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: acf-open-icons-lite
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

if (! defined('ABSPATH')) {
  exit;
}

/**
 * Check for plugin conflicts before activation.
 * Prevents activation if the Premium version is active.
 */
function acfoil_activation_check() {
  // Need to include plugin.php for is_plugin_active()
  if (! function_exists('is_plugin_active')) {
    include_once ABSPATH . 'wp-admin/includes/plugin.php';
  }

  if (is_plugin_active('acf-open-icons/acf-open-icons.php')) {
    deactivate_plugins(plugin_basename(__FILE__));
    wp_die(
      esc_html__('ACF Open Icons Lite cannot be activated while ACF Open Icons (Premium) is active. Please deactivate the Premium version first.', 'acf-open-icons-lite'),
      esc_html__('Plugin Activation Error', 'acf-open-icons-lite'),
      ['back_link' => true]
    );
  }
}
register_activation_hook(__FILE__, 'acfoil_activation_check');

/**
 * Runtime conflict check.
 * If Premium version is somehow active alongside Lite, deactivate Lite and show notice.
 */
function acfoil_runtime_conflict_check() {
  // Check if Premium version's constant is defined (meaning it loaded first)
  if (defined('ACFOI_PLUGIN_FILE')) {
    // Premium is active - deactivate ourselves
    if (! function_exists('deactivate_plugins')) {
      require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }

    deactivate_plugins(plugin_basename(__FILE__));

    add_action('admin_notices', function () {
      echo '<div class="notice notice-error"><p>';
      echo esc_html__('ACF Open Icons Lite has been deactivated because ACF Open Icons (Premium) is active. Only one version can be active at a time.', 'acf-open-icons-lite');
      echo '</p></div>';
    });

    return false;
  }

  return true;
}

// Run conflict check early in plugins_loaded
add_action('plugins_loaded', function () {
  // Check for conflicts first
  if (! acfoil_runtime_conflict_check()) {
    return;
  }

  // Load text domain
  load_plugin_textdomain('acf-open-icons-lite', false, dirname(plugin_basename(__FILE__)) . '/languages');

  // Define constants
  define('ACFOIL_PLUGIN_FILE', __FILE__);
  define('ACFOIL_PLUGIN_DIR', plugin_dir_path(__FILE__));
  define('ACFOIL_PLUGIN_URL', plugin_dir_url(__FILE__));
  define('ACFOIL_VERSION', '1.0.0');

  // Simple autoloader for ACFOIL classes
  spl_autoload_register(function ($class) {
    if (strpos($class, 'ACFOIL\\') !== 0) {
      return;
    }
    $relative = str_replace(['ACFOIL\\', '\\'], ['', '/'], $class);
    $path = ACFOIL_PLUGIN_DIR . 'includes/class-' . strtolower(str_replace('_', '-', $relative)) . '.php';
    if (file_exists($path)) {
      require_once $path;
    }
  });

  // Load helpers
  require_once ACFOIL_PLUGIN_DIR . 'includes/helpers.php';

  // Initialise plugin components
  $providers = new ACFOIL\Providers();
  $sanitiser = new ACFOIL\Sanitiser();
  $cache     = new ACFOIL\Cache($providers, $sanitiser);
  $rest      = new ACFOIL\Rest($providers, $cache);
  $tracking  = new ACFOIL\Tracking();
  $settings  = new ACFOIL\Settings($providers, $cache, $tracking);

  // Register ACF field type
  add_action('acf/init', function () use ($providers, $cache, $sanitiser) {
    if (function_exists('acf_register_field_type')) {
      acf_register_field_type(new ACFOIL\ACF_Field_Open_Icons($providers, $cache, $sanitiser));
    }
  });
}, 5); // Priority 5 to run early

/**
 * Enqueue admin assets on appropriate screens.
 */
function acfoil_enqueue_admin_assets() {
  $screen = function_exists('get_current_screen') ? get_current_screen() : null;
  $base = $screen ? $screen->base : '';

  // Settings page uses a different hook path
  $is_settings = (strpos($base, 'acf-open-icons-lite') !== false);

  if (! $screen || ! (in_array($base, ['post', 'post-new'], true) || $is_settings)) {
    return;
  }

  if ($is_settings && method_exists('ACFOIL\\Asset_Loader', 'enqueue_settings_assets')) {
    ACFOIL\Asset_Loader::enqueue_settings_assets();
  } else {
    ACFOIL\Asset_Loader::enqueue_picker_assets();
  }
}
add_action('admin_enqueue_scripts', 'acfoil_enqueue_admin_assets');

/**
 * Create cache directory on activation.
 */
register_activation_hook(__FILE__, function () {
  $uploads = wp_upload_dir();
  $dir     = trailingslashit($uploads['basedir']) . 'acf-open-icons/cache';
  if (! wp_mkdir_p($dir)) {
    // Keep silent; will retry later
  }

  // Set flag for first activation notice
  if (! get_option('acfoil_tracking_noticed')) {
    update_option('acfoil_first_activation', true);
  }
});

/**
 * Clean up on deactivation.
 */
register_deactivation_hook(__FILE__, function () {
  // Clean up cache directory
  $uploads = wp_upload_dir();
  $dir     = trailingslashit($uploads['basedir']) . 'acf-open-icons';
  if (is_dir($dir)) {
    ACFOIL\Cache::purge_all_directory($dir);
  }

  // Reset tracking settings so notice shows again on reactivation
  delete_option('acfoil_tracking_enabled');
  delete_option('acfoil_tracking_noticed');
  delete_option('acfoil_first_activation');

  // Clear scheduled tracking ping
  $timestamp = wp_next_scheduled('acfoil_tracking_ping');
  if ($timestamp) {
    wp_unschedule_event($timestamp, 'acfoil_tracking_ping');
  }
});
