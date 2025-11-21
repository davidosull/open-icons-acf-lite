<?php

namespace ACFOI;

if (! defined('ABSPATH')) {
  exit;
}

class Settings {
  private $option_key = 'acf_open_icons_settings';
  private $providers;
  private $cache;
  private $migration;
  private $old_settings_value = null;

  public function __construct(Providers $providers, Cache $cache, ?Migration $migration = null) {
    $this->providers = $providers;
    $this->cache     = $cache;
    $this->migration = $migration;
    add_action('admin_menu', [$this, 'register_menu']);
    add_action('admin_init', [$this, 'register_settings']);
    add_action('admin_post_acfoi_purge_cache', [$this, 'handle_purge']);
    add_action('admin_post_acfoi_restore_defaults', [$this, 'handle_restore']);

    // Hook into option update to detect provider changes
    // Use priority 20 to ensure it runs after sanitization
    add_action('update_option_' . $this->option_key, [$this, 'detect_provider_change'], 20, 2);

    // Hook into option update to detect color token changes
    // Use priority 25 to run after provider change detection
    add_action('update_option_' . $this->option_key, [$this, 'detect_color_token_changes'], 25, 2);
  }

  public function register_menu(): void {
    add_submenu_page(
      'edit.php?post_type=acf-field-group',
      __('Open Icons', 'acf-open-icons'),
      __('Open Icons', 'acf-open-icons'),
      'manage_options',
      'acf-open-icons',
      [$this, 'render_page']
    );
  }

  public function register_settings(): void {
    register_setting('acf_open-icons', $this->option_key, [
      'sanitize_callback' => [$this, 'sanitize_settings'],
    ]);
  }

  /**
   * Sanitize settings and detect provider changes.
   *
   * @param mixed $value New settings value
   * @return array Sanitized settings value
   */
  public function sanitize_settings($value): array {
    // Store old value before sanitization (for use in detect_provider_change)
    $this->old_settings_value = get_option($this->option_key, []);

    // Ensure value is an array
    $value = is_array($value) ? $value : [];

    // Remove the nonce from the value if present
    if (isset($value['__nonce'])) {
      unset($value['__nonce']);
    }

    return $value;
  }

  public function get_settings(): array {
    $defaults = [
      'activeProvider' => 'lucide',
      'pinnedVersion'  => 'latest',
      'palette'        => [
        ['token' => 'A', 'label' => 'Primary', 'hex' => '#18181b'],
        ['token' => 'B', 'label' => 'Secondary', 'hex' => '#71717a'],
        ['token' => 'C', 'label' => 'Accent', 'hex' => '#34d399'],
      ],
      'defaultToken'   => 'A',
    ];
    return wp_parse_args(get_option($this->option_key, []), $defaults);
  }

  /**
   * Get current active provider.
   *
   * @return string Provider key
   */
  public function get_current_provider(): string {
    $settings = $this->get_settings();
    return $settings['activeProvider'] ?? 'lucide';
  }

  public function handle_purge(): void {
    if (! current_user_can('manage_options')) {
      wp_die('forbidden');
    }
    check_admin_referer('acfoi_admin');
    // Purge ALL providers/versions to avoid surprises when switching sets
    $this->cache->purge_all();
    wp_safe_redirect(add_query_arg(['page' => 'acf-open-icons', 'purged' => 1], admin_url('edit.php?post_type=acf-field-group')));
    exit;
  }

  public function handle_restore(): void {
    if (! current_user_can('manage_options')) {
      wp_die('forbidden');
    }
    check_admin_referer('acfoi_admin');
    delete_option($this->option_key);
    wp_safe_redirect(add_query_arg(['page' => 'acf-open-icons', 'restored' => 1], admin_url('edit.php?post_type=acf-field-group')));
    exit;
  }

  /**
   * Detect provider changes and trigger migration.
   *
   * @param array $old_value Old settings value
   * @param array $new_value New settings value
   */
  public function detect_provider_change($old_value, $new_value): void {
    if (! $this->migration || ! current_user_can('manage_options')) {
      return;
    }

    // Use stored old value if available (captured during sanitization), otherwise use hook value
    $old_value_to_use = $this->old_settings_value !== null ? $this->old_settings_value : $old_value;

    // Handle both array and object formats
    $old_value_to_use = is_array($old_value_to_use) ? $old_value_to_use : (array) $old_value_to_use;
    $new_value = is_array($new_value) ? $new_value : (array) $new_value;

    $old_provider = $old_value_to_use['activeProvider'] ?? 'lucide';
    $new_provider = $new_value['activeProvider'] ?? 'lucide';
    $new_version  = $new_value['pinnedVersion'] ?? 'latest';

    // Only migrate if provider actually changed
    if ($old_provider === $new_provider) {
      return;
    }

    // Run migration (no result storage needed - frontend will query status)
    $results = $this->migration->migrate_icons($old_provider, $new_provider, $new_version);
  }

  /**
   * Detect color token changes and update stored icons.
   *
   * @param array $old_value Old settings value
   * @param array $new_value New settings value
   */
  public function detect_color_token_changes($old_value, $new_value): void {
    if (! $this->migration || ! current_user_can('manage_options')) {
      return;
    }

    // Use stored old value if available (captured during sanitization), otherwise use hook value
    $old_value_to_use = $this->old_settings_value !== null ? $this->old_settings_value : $old_value;

    // Handle both array and object formats
    $old_value_to_use = is_array($old_value_to_use) ? $old_value_to_use : (array) $old_value_to_use;
    $new_value = is_array($new_value) ? $new_value : (array) $new_value;

    $old_palette = $old_value_to_use['palette'] ?? [];
    $new_palette = $new_value['palette'] ?? [];

    // Build maps for easy comparison
    $old_palette_map = [];
    if (is_array($old_palette)) {
      foreach ($old_palette as $item) {
        if (isset($item['token']) && isset($item['hex'])) {
          $old_palette_map[$item['token']] = $item['hex'];
        }
      }
    }

    $new_palette_map = [];
    if (is_array($new_palette)) {
      foreach ($new_palette as $item) {
        if (isset($item['token']) && isset($item['hex'])) {
          $new_palette_map[$item['token']] = $item['hex'];
        }
      }
    }

    // Find tokens that changed
    $changed_tokens = [];
    foreach ($new_palette_map as $token => $new_hex) {
      $old_hex = $old_palette_map[$token] ?? null;
      if ($old_hex !== null && $old_hex !== $new_hex) {
        $changed_tokens[] = $token;
      }
    }

    // Also check for tokens that were removed (though this is less common)
    foreach ($old_palette_map as $token => $old_hex) {
      if (! isset($new_palette_map[$token])) {
        // We could handle this, but for now we'll skip removed tokens
      }
    }

    // Update icons if any tokens changed
    if (! empty($changed_tokens)) {
      $results = $this->migration->update_icons_by_color_tokens($changed_tokens);
    }
  }

  public function render_page(): void {
    // Check license status
    $licence = new Licence();
    $is_valid = $licence->is_valid();
    $status = $licence->get_license_status();
    $license_data = $licence->get_status();

    $settings  = $this->get_settings();
    $providers = $this->providers->all();
?>
    <div class="wrap">
      <h1><?php echo esc_html__('Open Icons Settings', 'acf-open-icons'); ?></h1>

      <?php
      // Always render the form so React UI can mount (it will hide/show sections based on license)
      // The form is needed for React to find and mount the UI
      ?>
      <form method="post" action="options.php" style="margin-bottom:16px; display:none;">
        <?php settings_fields('acf_open-icons'); ?>
        <input type="hidden" name="<?php echo esc_attr($this->option_key); ?>[__nonce]" value="<?php echo esc_attr(wp_create_nonce('acfoi_admin')); ?>" />
        <?php
        // Always render the table (hidden) so React can read provider options
        // React UI will show/hide sections based on license status
        ?>
        <table class="form-table" role="presentation" style="display:none;">
          <tr>
            <th scope="row"><?php esc_html_e('Icon Set', 'acf-open-icons'); ?></th>
            <td>
              <select name="<?php echo esc_attr($this->option_key); ?>[activeProvider]">
                <?php foreach ($providers as $key => $meta) : ?>
                  <option value="<?php echo esc_attr($key); ?>" <?php selected($settings['activeProvider'], $key); ?>><?php echo esc_html($meta['label']); ?></option>
                <?php endforeach; ?>
              </select>
            </td>
          </tr>
          <tr>
            <th scope="row"><?php esc_html_e('Version', 'acf-open-icons'); ?></th>
            <td>
              <input type="text" name="<?php echo esc_attr($this->option_key); ?>[pinnedVersion]" value="<?php echo esc_attr($settings['pinnedVersion']); ?>" placeholder="latest or 1.0.0" />
            </td>
          </tr>
          <tr>
            <th scope="row"><?php esc_html_e('Palette colors', 'acf-open-icons'); ?></th>
            <td>
              <?php foreach (['A', 'B', 'C'] as $i => $t) : $item = $settings['palette'][$i] ?? null; ?>
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
                  <label style="width:70px;">Token <?php echo esc_html($t); ?></label>
                  <input type="text" name="<?php echo esc_attr($this->option_key); ?>[palette][<?php echo esc_attr($i); ?>][label]" value="<?php echo esc_attr($item['label'] ?? ''); ?>" placeholder="Label" />
                  <input type="color" name="<?php echo esc_attr($this->option_key); ?>[palette][<?php echo esc_attr($i); ?>][hex]" value="<?php echo esc_attr($item['hex'] ?? '#111111'); ?>" />
                  <input type="hidden" name="<?php echo esc_attr($this->option_key); ?>[palette][<?php echo esc_attr($i); ?>][token]" value="<?php echo esc_attr($t); ?>" />
                </div>
              <?php endforeach; ?>
              <div style="margin-top:8px;">
                <label><?php esc_html_e('Default palette token', 'acf-open-icons'); ?></label>
                <select name="<?php echo esc_attr($this->option_key); ?>[defaultToken]">
                  <?php foreach (['A', 'B', 'C'] as $t) : ?>
                    <option value="<?php echo esc_attr($t); ?>" <?php selected($settings['defaultToken'], $t); ?>><?php echo esc_html($t); ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
            </td>
          </tr>
        </table>
        <?php submit_button(); ?>
      </form>
      <?php
      // Always render purge/restore forms (hidden) so React can find them if needed
      // React will show/hide buttons based on license status
      ?>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:none;">
        <?php wp_nonce_field('acfoi_admin'); ?>
        <input type="hidden" name="action" value="acfoi_purge_cache" />
        <?php submit_button(__('Purge Icon Cache', 'acf-open-icons'), 'secondary'); ?>
      </form>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:none;">
        <?php wp_nonce_field('acfoi_admin'); ?>
        <input type="hidden" name="action" value="acfoi_restore_defaults" />
        <?php submit_button(__('Restore Defaults', 'acf-open-icons'), 'delete'); ?>
      </form>
    </div>
<?php
  }
}
