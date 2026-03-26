<?php

/**
 * Plugin Name: Open Icons for ACF (Lite)
 * Plugin URI:  https://acfopenicons.com
 * Description: ACF field that lets you use the Heroicons icon set with sanitisation and stable rendering. Free version with 300+ icons.
 * Version: 1.0.0
 * Author: David O'Sullivan
 * Author URI: https://inovomedia.co.uk
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: open-icons-acf
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
function openicon_activation_check() {
  if (! function_exists('is_plugin_active')) {
    include_once ABSPATH . 'wp-admin/includes/plugin.php';
  }

  if (is_plugin_active('acf-open-icons/acf-open-icons.php')) {
    deactivate_plugins(plugin_basename(__FILE__));
    wp_die(
      esc_html__('Open Icons for ACF (Lite) cannot be activated while ACF Open Icons (Premium) is active. Please deactivate the Premium version first.', 'open-icons-acf'),
      esc_html__('Plugin Activation Error', 'open-icons-acf'),
      ['back_link' => true]
    );
  }
}
register_activation_hook(__FILE__, 'openicon_activation_check');

/**
 * Runtime conflict check.
 * If Premium version is somehow active alongside Lite, deactivate Lite and show notice.
 */
function openicon_runtime_conflict_check() {
  if (defined('ACFOI_PLUGIN_FILE')) {
    if (! function_exists('deactivate_plugins')) {
      require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }

    deactivate_plugins(plugin_basename(__FILE__));

    add_action('admin_notices', function () {
      echo '<div class="notice notice-error"><p>';
      echo esc_html__('Open Icons for ACF (Lite) has been deactivated because ACF Open Icons (Premium) is active. Only one version can be active at a time.', 'open-icons-acf');
      echo '</p></div>';
    });

    return false;
  }

  return true;
}

add_action('plugins_loaded', function () {
  if (! openicon_runtime_conflict_check()) {
    return;
  }

  define('OPENICON_PLUGIN_FILE', __FILE__);
  define('OPENICON_PLUGIN_DIR', plugin_dir_path(__FILE__));
  define('OPENICON_PLUGIN_URL', plugin_dir_url(__FILE__));
  define('OPENICON_VERSION', '1.0.0');

  spl_autoload_register(function ($class) {
    if (strpos($class, 'OPENICON\\') !== 0) {
      return;
    }
    $relative = str_replace(['OPENICON\\', '\\'], ['', '/'], $class);
    $path = OPENICON_PLUGIN_DIR . 'includes/class-' . strtolower(str_replace('_', '-', $relative)) . '.php';
    if (file_exists($path)) {
      require_once $path;
    }
  });

  require_once OPENICON_PLUGIN_DIR . 'includes/helpers.php';

  $providers = new OPENICON\Providers();
  $cache     = new OPENICON\Cache($providers);
  $rest      = new OPENICON\Rest($providers, $cache);
  $settings  = new OPENICON\Settings($providers);

  add_action('acf/init', function () use ($providers, $cache) {
    if (function_exists('acf_register_field_type')) {
      $sanitiser = new OPENICON\Sanitiser();
      acf_register_field_type(new OPENICON\ACF_Field_Open_Icons($providers, $cache, $sanitiser));
    }
  });
}, 5);

/**
 * Enqueue admin assets on appropriate screens.
 */
function openicon_enqueue_admin_assets() {
  $screen = function_exists('get_current_screen') ? get_current_screen() : null;
  $base = $screen ? $screen->base : '';

  $is_settings = (strpos($base, 'open-icons-acf') !== false);

  if (! $screen || ! (in_array($base, ['post', 'post-new'], true) || $is_settings)) {
    return;
  }

  if ($is_settings && method_exists('OPENICON\\Asset_Loader', 'enqueue_settings_assets')) {
    OPENICON\Asset_Loader::enqueue_settings_assets();
  } else {
    OPENICON\Asset_Loader::enqueue_picker_assets();
  }
}
add_action('admin_enqueue_scripts', 'openicon_enqueue_admin_assets');
