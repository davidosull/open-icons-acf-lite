<?php

/**
 * Plugin Name: Advanced Custom Fields: Open Icons
 * Description: ACF field that lets you use popular open-source icon sets (Lucide, Tabler, Heroicons, etc.) with caching, sanitisation, and stable rendering.
 * Version: 0.3.0
 * Author: David O'Sullivan
 * Author URI: https://osull.io
 * License: Proprietary
 * Text Domain: acf-open-icons
 */

if (! defined('ABSPATH')) {
  exit;
}

// Constants.
define('ACFOI_PLUGIN_FILE', __FILE__);
define('ACFOI_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ACFOI_PLUGIN_URL', plugin_dir_url(__FILE__));

// Simple autoloader for ACFOI classes.
spl_autoload_register(function ($class) {
  if (strpos($class, 'ACFOI\\') !== 0) {
    return;
  }
  $relative = str_replace(['ACFOI\\', '\\'], ['', '/'], $class);
  $path = ACFOI_PLUGIN_DIR . 'includes/class-' . strtolower(str_replace('_', '-', $relative)) . '.php';
  if (file_exists($path)) {
    require_once $path;
  }
});

// Load helpers.
require_once ACFOI_PLUGIN_DIR . 'includes/helpers.php';

add_action('plugins_loaded', function () {
  load_plugin_textdomain('acf-open-icons', false, dirname(plugin_basename(__FILE__)) . '/languages');

  $providers = new ACFOI\Providers();
  $sanitiser = new ACFOI\Sanitiser();
  $cache     = new ACFOI\Cache($providers, $sanitiser);
  $rest      = new ACFOI\Rest($providers, $cache);
  $migration = new ACFOI\Migration($providers, $cache, $rest);
  // Set migration on rest for migrate endpoint
  $rest->set_migration($migration);
  $settings  = new ACFOI\Settings($providers, $cache, $migration);

  add_action('acf/init', function () use ($providers, $cache, $sanitiser) {
    if (function_exists('acf_register_field_type')) {
      acf_register_field_type(new ACFOI\ACF_Field_Open_Icons($providers, $cache, $sanitiser));
    }
  });
});

function acfoi_enqueue_frontend_assets() {
  $screen = function_exists('get_current_screen') ? get_current_screen() : null;
  $base = $screen ? $screen->base : '';
  // Settings page uses a different hook path
  $is_settings = (strpos($base, 'acf-open-icons') !== false);
  if (! $screen || ! (in_array($base, ['post', 'post-new'], true) || $is_settings)) {
    return;
  }

  if ($is_settings && method_exists('ACFOI\\Asset_Loader', 'enqueue_settings_assets')) {
    ACFOI\Asset_Loader::enqueue_settings_assets();
  } else {
    ACFOI\Asset_Loader::enqueue_picker_assets();
  }
}
add_action('admin_enqueue_scripts', 'acfoi_enqueue_frontend_assets');

register_activation_hook(__FILE__, function () {
  $uploads = wp_upload_dir();
  $dir     = trailingslashit($uploads['basedir']) . 'acf-open-icons/cache';
  if (! wp_mkdir_p($dir)) {
    // keep silent; will retry later
  }
});

register_deactivation_hook(__FILE__, function () {
  $uploads = wp_upload_dir();
  $dir     = trailingslashit($uploads['basedir']) . 'acf-open-icons';
  if (is_dir($dir)) {
    ACFOI\Cache::purge_all_directory($dir);
  }
});
