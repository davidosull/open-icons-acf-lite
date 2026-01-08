<?php

namespace ACFOIL;

if (! defined('ABSPATH')) {
  exit;
}

/**
 * Opt-in usage tracking for ACF Open Icons Lite.
 * Sends anonymous activation data to help improve the plugin.
 */
class Tracking {
  private $option_key = 'acfoil_tracking_enabled';
  private $noticed_key = 'acfoil_tracking_noticed';
  private $server_url;

  public function __construct() {
    $this->server_url = apply_filters(
      'acfoil_tracking_server_url',
      'https://acf-open-icons-licensing.vercel.app'
    );

    // Show opt-in notice on first activation
    add_action('admin_notices', [$this, 'maybe_show_optin_notice']);

    // Show success notice after enabling tracking
    add_action('admin_notices', [$this, 'show_tracking_enabled_notice']);

    // Handle opt-in/opt-out actions
    add_action('admin_init', [$this, 'handle_tracking_action']);

    // Schedule tracking ping if enabled
    if ($this->is_enabled()) {
      // Send ping on activation and weekly thereafter
      if (! wp_next_scheduled('acfoil_tracking_ping')) {
        wp_schedule_event(time(), 'weekly', 'acfoil_tracking_ping');
      }
      add_action('acfoil_tracking_ping', [$this, 'send_ping']);
    }
  }

  /**
   * Check if tracking is enabled.
   *
   * @return bool
   */
  public function is_enabled(): bool {
    return (bool) get_option($this->option_key, false);
  }

  /**
   * Enable tracking.
   */
  public function enable(): void {
    update_option($this->option_key, true);
    update_option($this->noticed_key, true);

    // Schedule weekly ping
    if (! wp_next_scheduled('acfoil_tracking_ping')) {
      wp_schedule_event(time(), 'weekly', 'acfoil_tracking_ping');
    }

    // Send initial ping
    $this->send_ping();
  }

  /**
   * Disable tracking.
   */
  public function disable(): void {
    update_option($this->option_key, false);

    // Clear scheduled ping
    $timestamp = wp_next_scheduled('acfoil_tracking_ping');
    if ($timestamp) {
      wp_unschedule_event($timestamp, 'acfoil_tracking_ping');
    }
  }

  /**
   * Show opt-in notice on first activation.
   */
  public function maybe_show_optin_notice(): void {
    // Only show to admins
    if (! current_user_can('manage_options')) {
      return;
    }

    // Don't show if already noticed
    if (get_option($this->noticed_key)) {
      return;
    }

    // Only show on plugins page (NOT on our settings page - React UI handles it there)
    $screen = get_current_screen();
    if (! $screen) {
      return;
    }

    // Don't show on our settings page - the React UI has tracking controls there
    $is_our_settings = strpos($screen->id, 'acf-open-icons-lite') !== false;
    if ($is_our_settings) {
      return;
    }

    // Only show on plugins page
    if ($screen->id !== 'plugins') {
      return;
    }

    $enable_url = wp_nonce_url(
      add_query_arg('acfoil_tracking', 'enable', admin_url('admin.php')),
      'acfoil_tracking_action'
    );
    $dismiss_url = wp_nonce_url(
      add_query_arg('acfoil_tracking', 'dismiss', admin_url('admin.php')),
      'acfoil_tracking_action'
    );

    ?>
    <div class="notice notice-info is-dismissible">
      <p>
        <strong><?php esc_html_e('ACF Open Icons Lite', 'acf-open-icons-lite'); ?></strong>
      </p>
      <p>
        <?php esc_html_e('Help improve ACF Open Icons Lite by allowing anonymous usage tracking. We collect minimal data: a hashed site URL, WordPress version, PHP version, and plugin version. No personal data is ever collected.', 'acf-open-icons-lite'); ?>
      </p>
      <p>
        <a href="<?php echo esc_url($enable_url); ?>" class="button button-primary">
          <?php esc_html_e('Allow Tracking', 'acf-open-icons-lite'); ?>
        </a>
        <a href="<?php echo esc_url($dismiss_url); ?>" class="button">
          <?php esc_html_e('No Thanks', 'acf-open-icons-lite'); ?>
        </a>
      </p>
    </div>
    <?php
  }

  /**
   * Handle tracking opt-in/opt-out actions.
   */
  public function handle_tracking_action(): void {
    if (! isset($_GET['acfoil_tracking'])) {
      return;
    }

    if (! current_user_can('manage_options')) {
      return;
    }

    if (! wp_verify_nonce($_GET['_wpnonce'] ?? '', 'acfoil_tracking_action')) {
      return;
    }

    $action = sanitize_key($_GET['acfoil_tracking']);

    if ($action === 'enable') {
      $this->enable();
      set_transient('acfoil_tracking_enabled_notice', true, 30);
    } elseif ($action === 'dismiss' || $action === 'disable') {
      update_option($this->noticed_key, true);
      if ($action === 'disable') {
        $this->disable();
      }
    }

    wp_safe_redirect(admin_url('plugins.php'));
    exit;
  }

  /**
   * Show success notice after enabling tracking.
   */
  public function show_tracking_enabled_notice(): void {
    if (get_transient('acfoil_tracking_enabled_notice')) {
      delete_transient('acfoil_tracking_enabled_notice');
      echo '<div class="notice notice-success is-dismissible"><p>';
      esc_html_e('Thank you for helping improve ACF Open Icons Lite!', 'acf-open-icons-lite');
      echo '</p></div>';
    }
  }

  /**
   * Send tracking ping to server.
   */
  public function send_ping(): void {
    if (! $this->is_enabled()) {
      return;
    }

    $data = [
      'site_url'       => home_url(),
      'wp_version'     => get_bloginfo('version'),
      'php_version'    => PHP_VERSION,
      'plugin_version' => defined('ACFOIL_VERSION') ? ACFOIL_VERSION : '1.0.0',
    ];

    wp_remote_post(
      trailingslashit($this->server_url) . 'api/free/ping',
      [
        'body'    => wp_json_encode($data),
        'headers' => [
          'Content-Type' => 'application/json',
        ],
        'timeout' => 10,
      ]
    );
  }

  /**
   * Get tracking status for settings display.
   *
   * @return array
   */
  public function get_status(): array {
    return [
      'enabled' => $this->is_enabled(),
      'noticed' => (bool) get_option($this->noticed_key, false),
    ];
  }
}
