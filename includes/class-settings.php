<?php

namespace ACFOIL;

if (! defined('ABSPATH')) {
  exit;
}

/**
 * Settings page for ACF Open Icons Lite.
 * Simplified version with upsell messaging and tracking opt-in.
 */
class Settings {
  private $option_key = 'acf_open_icons_settings';
  private $providers;
  private $cache;
  private $tracking;

  public function __construct(Providers $providers, Cache $cache, ?Tracking $tracking = null) {
    $this->providers = $providers;
    $this->cache     = $cache;
    $this->tracking  = $tracking;
    add_action('admin_menu', [$this, 'register_menu']);
    add_action('admin_init', [$this, 'register_settings']);
    add_action('admin_post_acfoil_purge_cache', [$this, 'handle_purge']);
    add_action('admin_post_acfoil_restore_defaults', [$this, 'handle_restore']);
  }

  public function register_menu(): void {
    add_submenu_page(
      'edit.php?post_type=acf-field-group',
      __('Open Icons', 'acf-open-icons-lite'),
      __('Open Icons', 'acf-open-icons-lite'),
      'manage_options',
      'acf-open-icons-lite',
      [$this, 'render_page']
    );
  }

  public function register_settings(): void {
    register_setting('acf_open_icons_lite', $this->option_key, [
      'sanitize_callback' => [$this, 'sanitize_settings'],
    ]);
  }

  /**
   * Sanitise settings.
   *
   * @param mixed $value New settings value
   * @return array Sanitised settings value
   */
  public function sanitize_settings($value): array {
    // Ensure value is an array
    $value = is_array($value) ? $value : [];

    // Remove the nonce from the value if present
    if (isset($value['__nonce'])) {
      unset($value['__nonce']);
    }

    // Force provider to heroicons (Lite only supports Heroicons)
    $value['activeProvider'] = 'heroicons';

    return $value;
  }

  public function get_settings(): array {
    $defaults = [
      'activeProvider' => 'heroicons',
      'pinnedVersion'  => 'latest',
      'palette'        => [
        ['token' => 'A', 'label' => 'Primary', 'hex' => '#18181b'],
        ['token' => 'B', 'label' => 'Secondary', 'hex' => '#71717a'],
        ['token' => 'C', 'label' => 'Accent', 'hex' => '#4f46e5'],
      ],
      'defaultToken'   => 'A',
    ];
    $settings = wp_parse_args(get_option($this->option_key, []), $defaults);

    // Force provider to heroicons for Lite version
    $settings['activeProvider'] = 'heroicons';

    return $settings;
  }

  /**
   * Get current active provider (always heroicons for Lite).
   *
   * @return string Provider key
   */
  public function get_current_provider(): string {
    return 'heroicons';
  }

  public function handle_purge(): void {
    if (! current_user_can('manage_options')) {
      wp_die('forbidden');
    }
    check_admin_referer('acfoil_admin');
    $this->cache->purge_all();
    wp_safe_redirect(add_query_arg(['page' => 'acf-open-icons-lite', 'purged' => 1], admin_url('edit.php?post_type=acf-field-group')));
    exit;
  }

  public function handle_restore(): void {
    if (! current_user_can('manage_options')) {
      wp_die('forbidden');
    }
    check_admin_referer('acfoil_admin');
    delete_option($this->option_key);
    wp_safe_redirect(add_query_arg(['page' => 'acf-open-icons-lite', 'restored' => 1], admin_url('edit.php?post_type=acf-field-group')));
    exit;
  }

  public function render_page(): void {
    $settings  = $this->get_settings();
    $providers = $this->providers->all();
    $premium_providers = $this->providers->get_premium_providers();
    $tracking_status = $this->tracking ? $this->tracking->get_status() : ['enabled' => false];
?>
    <div class="wrap">
      <h1><?php echo esc_html__('Open Icons Settings', 'acf-open-icons-lite'); ?></h1>

      <?php
      // The React UI will mount here and replace the native form
      // The form is needed for React to find and mount the UI
      ?>
      <form method="post" action="options.php" style="margin-bottom:16px; display:none;">
        <?php settings_fields('acf_open_icons_lite'); ?>
        <input type="hidden" name="<?php echo esc_attr($this->option_key); ?>[__nonce]" value="<?php echo esc_attr(wp_create_nonce('acfoil_admin')); ?>" />
        <input type="hidden" name="<?php echo esc_attr($this->option_key); ?>[activeProvider]" value="heroicons" />

        <table class="form-table" role="presentation" style="display:none;">
          <tr>
            <th scope="row"><?php esc_html_e('Icon Set', 'acf-open-icons-lite'); ?></th>
            <td>
              <select name="<?php echo esc_attr($this->option_key); ?>[activeProvider]" disabled>
                <?php foreach ($providers as $key => $meta) : ?>
                  <option value="<?php echo esc_attr($key); ?>" <?php selected($settings['activeProvider'], $key); ?>><?php echo esc_html($meta['label']); ?></option>
                <?php endforeach; ?>
              </select>
            </td>
          </tr>
          <tr>
            <th scope="row"><?php esc_html_e('Palette colours', 'acf-open-icons-lite'); ?></th>
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
                <label><?php esc_html_e('Default palette token', 'acf-open-icons-lite'); ?></label>
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

      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:none;">
        <?php wp_nonce_field('acfoil_admin'); ?>
        <input type="hidden" name="action" value="acfoil_purge_cache" />
        <?php submit_button(__('Purge Icon Cache', 'acf-open-icons-lite'), 'secondary'); ?>
      </form>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:none;">
        <?php wp_nonce_field('acfoil_admin'); ?>
        <input type="hidden" name="action" value="acfoil_restore_defaults" />
        <?php submit_button(__('Restore Defaults', 'acf-open-icons-lite'), 'delete'); ?>
      </form>
    </div>
<?php
  }

  /**
   * Get tracking instance.
   *
   * @return Tracking|null
   */
  public function get_tracking(): ?Tracking {
    return $this->tracking;
  }
}
