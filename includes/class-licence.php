<?php

namespace ACFOI;

if (! defined('ABSPATH')) {
  exit;
}

class Licence {
  private $option_key = 'acfoi_licence';
  private $server_url;
  private $cache_duration = 3600; // 1 hour cache

  public function __construct() {
    // Allow filtering the licensing server URL
    $this->server_url = apply_filters(
      'acfoi_licensing_server_url',
      defined('ACFOI_LICENSING_SERVER_URL') ? ACFOI_LICENSING_SERVER_URL : 'https://acf-open-icons-licensing.vercel.app'
    );

    add_action('admin_init', [$this, 'maybe_block_without_licence']);

    // Schedule periodic license validation
    if (! wp_next_scheduled('acfoi_validate_license')) {
      wp_schedule_event(time(), 'daily', 'acfoi_validate_license');
    }
    add_action('acfoi_validate_license', [$this, 'validate_license_cron']);
  }

  /**
   * Get licensing server URL
   */
  private function get_server_url(): string {
    return trailingslashit($this->server_url);
  }

  /**
   * Check if license is valid (active or in grace period)
   */
  public function is_valid(): bool {
    $status = $this->get_license_status();
    return in_array($status, ['active', 'grace_period'], true);
  }

  /**
   * Get current license status
   */
  public function get_license_status(): string {
    $licence = $this->get_status();

    if (empty($licence['license_key'])) {
      return 'invalid';
    }

    // Check if we have cached status that's still valid
    if (isset($licence['status_cached_at'])) {
      $cache_age = time() - (int) $licence['status_cached_at'];
      if ($cache_age < $this->cache_duration && isset($licence['status'])) {
        return $licence['status'];
      }
    }

    // Status is stale or missing, validate remotely
    $this->validate_license();

    // Return updated status
    $licence = $this->get_status();
    return $licence['status'] ?? 'invalid';
  }

  /**
   * Check if license is in grace period
   */
  public function is_in_grace_period(): bool {
    return $this->get_license_status() === 'grace_period';
  }

  /**
   * Check if license has expired (after grace period)
   */
  public function is_expired(): bool {
    $status = $this->get_license_status();
    return $status === 'expired';
  }

  /**
   * Check if picker should be blocked
   */
  public function should_block_picker(): bool {
    // Block if no valid license (invalid, expired, or no license at all)
    return ! $this->is_valid();
  }

  /**
   * Check if settings should be blocked
   */
  public function should_block_settings(): bool {
    // Block if no valid license (invalid, expired, or no license at all)
    return ! $this->is_valid();
  }

  /**
   * Check if license section should be shown (always show so users can activate)
   */
  public function should_show_license_section(): bool {
    // Always show license section
    return true;
  }

  /**
   * Get license status data
   */
  public function get_status(): array {
    return (array) get_option($this->option_key, []);
  }

  /**
   * Activate a license
   */
  public function activate(string $license_key): array {
    $site_url = home_url();

    $response = wp_remote_post($this->get_server_url() . 'api/activate', [
      'body' => json_encode([
        'license_key' => $license_key,
        'site_url' => $site_url,
      ]),
      'headers' => [
        'Content-Type' => 'application/json',
      ],
      'timeout' => 15,
    ]);

    if (is_wp_error($response)) {
      return [
        'success' => false,
        'message' => $response->get_error_message(),
      ];
    }

    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    if (! $data || ! isset($data['success']) || ! $data['success']) {
      return [
        'success' => false,
        'message' => $data['message'] ?? __('Failed to activate license.', 'acf-open-icons'),
      ];
    }

    // Store license data
    $license = $data['license'] ?? [];
    $this->update_license_data($license_key, $license);

    return [
      'success' => true,
      'message' => $data['message'] ?? __('License activated successfully.', 'acf-open-icons'),
      'license' => $license,
    ];
  }

  /**
   * Deactivate a license
   */
  public function deactivate(): bool {
    delete_option($this->option_key);
    return true;
  }

  /**
   * Validate license with server
   */
  public function validate_license(): array {
    $licence = $this->get_status();

    if (empty($licence['license_key'])) {
      return [
        'valid' => false,
        'status' => 'invalid',
      ];
    }

    $site_url = home_url();

    $response = wp_remote_post($this->get_server_url() . 'api/validate', [
      'body' => json_encode([
        'license_key' => $licence['license_key'],
        'site_url' => $site_url,
      ]),
      'headers' => [
        'Content-Type' => 'application/json',
      ],
      'timeout' => 15,
    ]);

    if (is_wp_error($response)) {
      // On error, keep existing status but mark cache as stale
      return [
        'valid' => $this->is_valid(),
        'status' => $licence['status'] ?? 'invalid',
      ];
    }

    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    if (! $data || ! isset($data['valid'])) {
      return [
        'valid' => false,
        'status' => 'invalid',
      ];
    }

    // Update license data with fresh information
    if (isset($data['license'])) {
      $this->update_license_data($licence['license_key'], $data['license'], $data['status']);
    } else {
      // Just update status
      $licence['status'] = $data['status'];
      $licence['status_cached_at'] = time();
      update_option($this->option_key, $licence);
    }

    return [
      'valid' => $data['valid'],
      'status' => $data['status'],
      'grace_days_remaining' => $data['grace_days_remaining'] ?? null,
    ];
  }

  /**
   * Update license data in options
   */
  private function update_license_data(string $license_key, array $license, ?string $status = null): void {
    $expires_at = $license['expires_at'] ?? null;
    $billing_cycle = $license['billing_cycle'] ?? null;
    $created_at = $license['created_at'] ?? null;

    // Calculate next payment date
    $next_payment = null;
    if ($expires_at) {
      $next_payment = $expires_at;
    }

    // Calculate purchase date (created_at or current time if not available)
    $purchase_date = $created_at ? $created_at : current_time('mysql');

    $data = [
      'license_key' => $license_key,
      'status' => $status ?? $license['status'] ?? 'invalid',
      'expires_at' => $expires_at,
      'billing_cycle' => $billing_cycle,
      'purchase_date' => $purchase_date,
      'next_payment' => $next_payment,
      'status_cached_at' => time(),
    ];

    update_option($this->option_key, $data);
  }

  /**
   * Cron job to validate license
   */
  public function validate_license_cron(): void {
    $this->validate_license();
  }

  /**
   * Block access if license is invalid
   */
  public function maybe_block_without_licence(): void {
    if (! is_admin()) {
      return;
    }

    $status = $this->get_license_status();

    // Show warning during grace period
    if ($status === 'grace_period') {
      $licence = $this->get_status();
      $expires_at = $licence['expires_at'] ?? null;
      $days_remaining = 0;

      if ($expires_at) {
        $expiry = strtotime($expires_at);
        $now = time();
        $days_since_expiry = floor(($now - $expiry) / DAY_IN_SECONDS);
        $days_remaining = max(0, 7 - $days_since_expiry);
      }

      add_action('admin_notices', function () use ($days_remaining) {
        echo '<div class="notice notice-warning"><p>';
        echo esc_html(
          sprintf(
            __('ACF: Open Icons license has expired. You have %d day(s) remaining in the grace period. Please renew your license.', 'acf-open-icons'),
            $days_remaining
          )
        );
        echo '</p></div>';
      });
    }

    // Block settings page if expired
    if ($this->should_block_settings()) {
      $screen = get_current_screen();
      if ($screen && strpos($screen->id, 'acf-open-icons') !== false) {
        add_action('admin_notices', function () {
          echo '<div class="notice notice-error"><p>';
          echo esc_html__('ACF: Open Icons license has expired. Please renew your license to access settings.', 'acf-open-icons');
          echo '</p></div>';
        });
      }
    }
  }
}
