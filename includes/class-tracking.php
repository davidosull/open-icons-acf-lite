<?php

namespace ACFOIL;

if (! defined('ABSPATH')) {
  exit;
}

class Tracking {
  private $server_url;
  private $cron_hook = 'acfoil_weekly_ping';

  public function __construct() {
    $this->server_url = apply_filters(
      'acfoil_tracking_server_url',
      'https://acf-open-icons-licensing.vercel.app'
    );

    // Schedule weekly ping if not already scheduled
    if (! wp_next_scheduled($this->cron_hook)) {
      wp_schedule_event(time(), 'weekly', $this->cron_hook);
    }

    add_action($this->cron_hook, [$this, 'send_ping']);
  }

  /**
   * Called on plugin activation
   */
  public static function on_activation(): void {
    $instance = new self();
    $instance->send_ping();
  }

  /**
   * Called on plugin deactivation
   */
  public static function on_deactivation(): void {
    wp_clear_scheduled_hook('acfoil_weekly_ping');
  }

  /**
   * Send anonymous usage ping to tracking server
   */
  public function send_ping(): void {
    // Don't track on local/dev environments
    $site_url = home_url();
    if ($this->is_local_environment($site_url)) {
      return;
    }

    $data = [
      'site_url'       => $site_url,
      'wp_version'     => get_bloginfo('version'),
      'php_version'    => PHP_VERSION,
      'plugin_version' => defined('ACFOIL_VERSION') ? ACFOIL_VERSION : '1.0.0',
    ];

    // Non-blocking request - fire and forget
    wp_remote_post(
      trailingslashit($this->server_url) . 'api/free/ping',
      [
        'body'      => wp_json_encode($data),
        'headers'   => ['Content-Type' => 'application/json'],
        'timeout'   => 5,
        'blocking'  => false,
        'sslverify' => true,
      ]
    );
  }

  /**
   * Check if running on a local/development environment
   */
  private function is_local_environment(string $url): bool {
    $local_patterns = [
      'localhost',
      '127.0.0.1',
      '.local',
      '.test',
      '.dev',
      '.staging',
      'dev.',
      'staging.',
      'local.',
    ];

    foreach ($local_patterns as $pattern) {
      if (stripos($url, $pattern) !== false) {
        return true;
      }
    }

    return false;
  }
}
