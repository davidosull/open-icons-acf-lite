<?php

namespace OPENICON;

if (! defined('ABSPATH')) {
  exit;
}

/**
 * Settings page for ACF Open Icons Lite.
 */
class Settings {
  private $option_key = 'openicon_settings';
  private $providers;

  public function __construct(Providers $providers) {
    $this->providers = $providers;
    add_action('admin_menu', [$this, 'register_menu']);
    add_action('admin_init', [$this, 'register_settings']);
    add_action('admin_post_openicon_restore_defaults', [$this, 'handle_restore']);
  }

  public function register_menu(): void {
    add_submenu_page(
      'edit.php?post_type=acf-field-group',
      __('Open Icons', 'open-icons-acf'),
      __('Open Icons', 'open-icons-acf'),
      'manage_options',
      'open-icons-acf',
      [$this, 'render_page']
    );
  }

  public function register_settings(): void {
    register_setting('openicon_lite', $this->option_key, [
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
    $value = is_array($value) ? $value : [];

    if (isset($value['__nonce'])) {
      unset($value['__nonce']);
    }

    $value['activeProvider'] = 'heroicons';

    if (isset($value['palette']) && is_array($value['palette'])) {
      foreach ($value['palette'] as $i => $item) {
        $value['palette'][$i]['label'] = sanitize_text_field($item['label'] ?? '');
        $value['palette'][$i]['hex'] = sanitize_hex_color($item['hex'] ?? '') ?: '#000000';
        $value['palette'][$i]['token'] = in_array($item['token'] ?? '', ['A', 'B', 'C'], true)
          ? $item['token'] : '';
      }
      $value['palette'] = array_slice($value['palette'], 0, 3);
    }

    $value['defaultToken'] = in_array($value['defaultToken'] ?? '', ['A', 'B', 'C'], true)
      ? $value['defaultToken'] : 'A';

    $allowed = ['activeProvider', 'palette', 'defaultToken'];
    $value = array_intersect_key($value, array_flip($allowed));

    return $value;
  }

  public function get_settings(): array {
    $defaults = [
      'activeProvider' => 'heroicons',
      'palette'        => [
        ['token' => 'A', 'label' => 'Primary', 'hex' => '#18181b'],
        ['token' => 'B', 'label' => 'Secondary', 'hex' => '#71717a'],
        ['token' => 'C', 'label' => 'Accent', 'hex' => '#4f46e5'],
      ],
      'defaultToken'   => 'A',
    ];
    $settings = wp_parse_args(get_option($this->option_key, []), $defaults);

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

  public function handle_restore(): void {
    if (! current_user_can('manage_options')) {
      wp_die('forbidden');
    }
    check_admin_referer('openicon_admin');
    delete_option($this->option_key);
    wp_safe_redirect(add_query_arg(['page' => 'open-icons-acf', 'restored' => 1], admin_url('edit.php?post_type=acf-field-group')));
    exit;
  }

  public function render_page(): void {
    $settings  = $this->get_settings();
    $providers = $this->providers->all();
?>
    <div class="wrap">
      <h1><?php echo esc_html__('Open Icons Settings', 'open-icons-acf'); ?></h1>

      <?php
      // The React UI will mount here and replace the native form
      ?>
      <form method="post" action="options.php" style="margin-bottom:16px; display:none;">
        <?php settings_fields('openicon_lite'); ?>
        <input type="hidden" name="<?php echo esc_attr($this->option_key); ?>[__nonce]" value="<?php echo esc_attr(wp_create_nonce('openicon_admin')); ?>" />
        <input type="hidden" name="<?php echo esc_attr($this->option_key); ?>[activeProvider]" value="heroicons" />

        <table class="form-table" role="presentation" style="display:none;">
          <tr>
            <th scope="row"><?php esc_html_e('Icon Set', 'open-icons-acf'); ?></th>
            <td>
              <select name="<?php echo esc_attr($this->option_key); ?>[activeProvider]" disabled>
                <?php foreach ($providers as $key => $meta) : ?>
                  <option value="<?php echo esc_attr($key); ?>" <?php selected($settings['activeProvider'], $key); ?>><?php echo esc_html($meta['label']); ?></option>
                <?php endforeach; ?>
              </select>
            </td>
          </tr>
          <tr>
            <th scope="row"><?php esc_html_e('Palette colours', 'open-icons-acf'); ?></th>
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
                <label><?php esc_html_e('Default palette token', 'open-icons-acf'); ?></label>
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
        <?php wp_nonce_field('openicon_admin'); ?>
        <input type="hidden" name="action" value="openicon_restore_defaults" />
        <?php submit_button(__('Restore Defaults', 'open-icons-acf'), 'delete'); ?>
      </form>
    </div>
<?php
  }
}
