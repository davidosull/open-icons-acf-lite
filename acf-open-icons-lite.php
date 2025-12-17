<?php

/**
 * Plugin Name: ACF Open Icons - Lite
 * Plugin URI: https://acfopenicons.com
 * Description: A beautiful icon picker field for Advanced Custom Fields, featuring 300+ Heroicons with colour palette support and SVG caching.
 * Version: 1.0.0
 * Author: David O'Sullivan
 * Author URI: https://osull.io
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: acf-open-icons-lite
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if (! defined('ABSPATH')) {
  exit;
}

// Constants.
define('ACFOIL_PLUGIN_FILE', __FILE__);
define('ACFOIL_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ACFOIL_PLUGIN_URL', plugin_dir_url(__FILE__));
define('ACFOIL_VERSION', '1.0.0');

// Simple autoloader for ACFOIL classes.
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

// Load helpers.
require_once ACFOIL_PLUGIN_DIR . 'includes/helpers.php';

add_action('plugins_loaded', function () {
  load_plugin_textdomain('acf-open-icons-lite', false, dirname(plugin_basename(__FILE__)) . '/languages');

  $providers = new ACFOIL\Providers();
  $sanitiser = new ACFOIL\Sanitiser();
  $cache     = new ACFOIL\Cache($providers, $sanitiser);
  $rest      = new ACFOIL\Rest($providers, $cache);
  $settings  = new ACFOIL\Settings($providers, $cache);
  $tracking  = new ACFOIL\Tracking();

  add_action('acf/init', function () use ($providers, $cache, $sanitiser) {
    if (function_exists('acf_register_field_type')) {
      acf_register_field_type(new ACFOIL\ACF_Field_Open_Icons($providers, $cache, $sanitiser));
    }
  });
});

function acfoil_enqueue_frontend_assets() {
  $screen = function_exists('get_current_screen') ? get_current_screen() : null;
  $base = $screen ? $screen->base : '';
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
add_action('admin_enqueue_scripts', 'acfoil_enqueue_frontend_assets');

register_activation_hook(__FILE__, function () {
  $uploads = wp_upload_dir();
  $dir     = trailingslashit($uploads['basedir']) . 'acf-open-icons-lite/cache';
  if (! wp_mkdir_p($dir)) {
    // keep silent; will retry later
  }

  if (class_exists('ACFOIL\\Tracking')) {
    ACFOIL\Tracking::on_activation();
  }
});

register_deactivation_hook(__FILE__, function () {
  $uploads = wp_upload_dir();
  $dir     = trailingslashit($uploads['basedir']) . 'acf-open-icons-lite';
  if (is_dir($dir)) {
    ACFOIL\Cache::purge_all_directory($dir);
  }

  if (class_exists('ACFOIL\\Tracking')) {
    ACFOIL\Tracking::on_deactivation();
  }
});
