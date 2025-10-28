<?php

namespace ACFOI;

if (! defined('ABSPATH')) {
  exit;
}

class Settings {
  private $option_key = 'acf_open_icons_settings';
  private $providers;
  private $cache;

  public function __construct(Providers $providers, Cache $cache) {
    $this->providers = $providers;
    $this->cache     = $cache;
    add_action('admin_menu', [$this, 'register_menu']);
    add_action('admin_init', [$this, 'register_settings']);
    add_action('admin_post_abi_purge_cache', [$this, 'handle_purge']);
    add_action('admin_post_abi_restore_defaults', [$this, 'handle_restore']);
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
    register_setting('acf_open-icons', $this->option_key);
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

  public function handle_purge(): void {
    if (! current_user_can('manage_options')) {
      wp_die('forbidden');
    }
    check_admin_referer('abi_admin');
    // Purge ALL providers/versions to avoid surprises when switching sets
    $this->cache->purge_all();
    wp_safe_redirect(add_query_arg(['page' => 'acf-open-icons', 'purged' => 1], admin_url('edit.php?post_type=acf-field-group')));
    exit;
  }

  public function handle_restore(): void {
    if (! current_user_can('manage_options')) {
      wp_die('forbidden');
    }
    check_admin_referer('abi_admin');
    delete_option($this->option_key);
    wp_safe_redirect(add_query_arg(['page' => 'acf-open-icons', 'restored' => 1], admin_url('edit.php?post_type=acf-field-group')));
    exit;
  }

  public function render_page(): void {
    $settings  = $this->get_settings();
    $providers = $this->providers->all();
?>
    <div class="wrap">
      <h1><?php echo esc_html__('Open Icons Settings', 'acf-open-icons'); ?></h1>
      <form method="post" action="options.php" style="margin-bottom:16px;">
        <?php settings_fields('acf_open-icons'); ?>
        <input type="hidden" name="<?php echo esc_attr($this->option_key); ?>[__nonce]" value="<?php echo esc_attr(wp_create_nonce('abi_admin')); ?>" />
        <table class="form-table" role="presentation">
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
            <th scope="row"><?php esc_html_e('Palette colours', 'acf-open-icons'); ?></th>
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
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
        <?php wp_nonce_field('abi_admin'); ?>
        <input type="hidden" name="action" value="abi_purge_cache" />
        <?php submit_button(__('Purge Icon Cache', 'acf-open-icons'), 'secondary'); ?>
      </form>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
        <?php wp_nonce_field('abi_admin'); ?>
        <input type="hidden" name="action" value="abi_restore_defaults" />
        <?php submit_button(__('Restore Defaults', 'acf-open-icons'), 'delete'); ?>
      </form>
    </div>
<?php
  }
}
