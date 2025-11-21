<?php

namespace ACFOI;

if (! defined('ABSPATH')) {
  exit;
}

if (! class_exists('\\acf_field')) {
  return;
}

class ACF_Field_Open_Icons extends \acf_field {
  private $providers;
  private $cache;
  private $sanitiser;
  private $licence;

  public function __construct(Providers $providers, Cache $cache, Sanitiser $sanitiser, ?Licence $licence = null) {
    $this->name     = 'open_icons';
    $this->label    = __('Open Icons', 'acf-open-icons');
    $this->category = 'content';
    $this->defaults = [
      'use_last_color' => 1,
    ];

    $this->providers = $providers;
    $this->cache     = $cache;
    $this->sanitiser = $sanitiser;
    $this->licence   = $licence ?? new Licence();
    parent::__construct();
  }

  public function render_field_settings($field) {
    acf_render_field_setting($field, [
      'label'        => __('Use Last Color', 'acf-open-icons'),
      'instructions' => __('When enabled, subsequent icon selections in the same context (repeater/flexible layout) will use the last selected color.', 'acf-open-icons'),
      'name'         => 'use_last_color',
      'type'         => 'true_false',
      'ui'           => 1,
      'default_value' => 1,
    ]);
  }

  public function render_field($field) {
    $settings = wp_parse_args(get_option('acf_open_icons_settings', []), [
      'activeProvider' => 'lucide',
      'pinnedVersion'  => 'latest',
    ]);

    $value   = is_array($field['value'] ?? null) ? $field['value'] : [];
    $stored  = $value['svg'] ?? '';
    $refKey  = esc_attr($value['iconKey'] ?? '');
    // For the picker modal, always use current active provider/version (so users see current icon set)
    // For stored values, use stored provider/version if icon exists, otherwise use current settings
    $pickerProv = esc_attr($settings['activeProvider']); // Always use current for picker
    $pickerVer  = esc_attr($settings['pinnedVersion']); // Always use current for picker
    $refProv = esc_attr((!empty($refKey) && isset($value['provider'])) ? $value['provider'] : $settings['activeProvider']);
    $refVer  = esc_attr((!empty($refKey) && isset($value['version'])) ? $value['version'] : $settings['pinnedVersion']);
    $field_name = esc_attr($field['name']);
    $instance_id = uniqid('acfoi_', false);
    $has_icon = !empty($refKey) && !empty($stored);
    $use_last_color = !empty($field['use_last_color']) ? '1' : '0';

    // Get field group key - traverse up parent chain to find field group
    $field_group_key = '';
    $current_parent = $field['parent'] ?? '';
    while ($current_parent) {
      if (function_exists('acf_get_field_group')) {
        $field_group = acf_get_field_group($current_parent);
        if ($field_group) {
          $field_group_key = $field_group['key'] ?? '';
          break;
        }
      }
      // Try as field instead
      if (function_exists('acf_get_field')) {
        $parent_field = acf_get_field($current_parent);
        if ($parent_field && isset($parent_field['parent'])) {
          $current_parent = $parent_field['parent'];
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // Field key for context identification
    $field_key = esc_attr($field['key'] ?? '');

    // Check license status
    $should_block_picker = $this->licence->should_block_picker();
    $is_in_grace_period = $this->licence->is_in_grace_period();
    $is_expired = $this->licence->is_expired();
    $license_status = $this->licence->get_license_status();
    $license_data = $this->licence->get_status();
    $has_license_key = ! empty($license_data['license_key']);

    // Show warning during grace period
    $show_grace_warning = $is_in_grace_period;
    $grace_days = 0;
    if ($is_in_grace_period) {
      $expires_at = $license_data['expires_at'] ?? null;
      if ($expires_at) {
        $expiry = strtotime($expires_at);
        $now = time();
        $days_since_expiry = floor(($now - $expiry) / DAY_IN_SECONDS);
        $grace_days = max(0, 7 - $days_since_expiry);
      }
    }
?>
    <div class="acfoi-field" id="<?php echo esc_attr($instance_id); ?>"
      data-acfoi-provider="<?php echo $pickerProv; ?>"
      data-acfoi-version="<?php echo $pickerVer; ?>"
      data-acfoi-instance-id="<?php echo esc_attr($instance_id); ?>"
      data-acfoi-use-last-color="<?php echo $use_last_color; ?>"
      data-acfoi-field-key="<?php echo $field_key; ?>"
      data-acfoi-field-group-key="<?php echo esc_attr($field_group_key); ?>"
      data-acfoi-picker-blocked="<?php echo $should_block_picker ? '1' : '0'; ?>">
      <input type="hidden" name="<?php echo $field_name; ?>[provider]" value="<?php echo $refProv; ?>" data-acfoi-provider-out />
      <input type="hidden" name="<?php echo $field_name; ?>[version]" value="<?php echo $refVer; ?>" data-acfoi-version-out />
      <input type="hidden" name="<?php echo $field_name; ?>[iconKey]" value="<?php echo $refKey; ?>" data-acfoi-key-out />
      <input type="hidden" name="<?php echo $field_name; ?>[colorToken]" value="<?php echo esc_attr($value['colorToken'] ?? ''); ?>" data-acfoi-color-token-out />
      <textarea class="acf-hidden" name="<?php echo $field_name; ?>[svg]" data-acfoi-svg-out><?php echo esc_textarea($stored); ?></textarea>

      <?php if ($show_grace_warning): ?>
        <div class="notice notice-warning inline" style="margin: 0 0 10px 0;">
          <p style="margin: 0.5em 0;">
            <?php
            echo esc_html(
              sprintf(
                __('License expired. You have %d day(s) remaining in the grace period. Please renew your license.', 'acf-open-icons'),
                $grace_days
              )
            );
            ?>
          </p>
        </div>
      <?php endif; ?>

      <?php if ($should_block_picker): ?>
        <?php
        $settings_url = admin_url('edit.php?post_type=acf-field-group&page=acf-open-icons');
        $link_text = __('activate your license', 'acf-open-icons');
        $message = sprintf(
          __('Please %s to enable this field.', 'acf-open-icons'),
          '<a href="' . esc_url($settings_url) . '" class="font-medium underline hover:text-yellow-900">' . esc_html($link_text) . '</a>'
        );
        ?>
        <div class="mb-2.5 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <?php echo $message; ?>
        </div>
      <?php endif; ?>

      <div class="acfoi-preview-wrap" style="display:flex;align-items:center;gap:12px;">
        <div class="acfoi-preview" style="width:40px;height:40px;border:1px solid #ddd;border-radius:4px;display:flex;align-items:center;justify-content:center;background:#fff;line-height:0;<?php echo $has_icon ? '' : 'display:none;'; ?>" title="<?php esc_attr_e('Click to change icon', 'acf-open-icons'); ?>" data-acfoi-preview>
          <?php echo $has_icon ? $stored : ''; ?>
        </div>
        <div class="acfoi-actions" style="display:flex;gap:8px;">
          <button class="button button-primary acfoi-select-button" type="button" data-acfoi-open <?php echo $should_block_picker ? 'disabled' : ''; ?>><?php echo $has_icon ? esc_html__('Change Icon', 'acf-open-icons') : esc_html__('Select Icon', 'acf-open-icons'); ?></button>
          <button class="button" type="button" data-acfoi-clear style="<?php echo $has_icon ? '' : 'display:none;'; ?>"><?php esc_html_e('Remove', 'acf-open-icons'); ?></button>
        </div>
      </div>
    </div>
    <script>
      (function() {
        const root = document.getElementById('<?php echo esc_js($instance_id); ?>');
        const clearBtn = root.querySelector('[data-acfoi-clear]');
        const openBtn = root.querySelector('[data-acfoi-open]');
        const pickerBlocked = root.getAttribute('data-acfoi-picker-blocked') === '1';

        // Block picker if license expired
        if (pickerBlocked && openBtn) {
          openBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            alert('<?php echo esc_js(__('License has expired. Please renew your license to select new icons.', 'acf-open-icons')); ?>');
            return false;
          });
        }

        function clear() {
          root.querySelector('[data-acfoi-key-out]').value = '';
          root.querySelector('[data-acfoi-svg-out]').value = '';
          const tokenInput = root.querySelector('[data-acfoi-color-token-out]');
          if (tokenInput) tokenInput.value = '';
          const preview = root.querySelector('[data-acfoi-preview]');
          if (preview) {
            preview.innerHTML = '';
            preview.style.display = 'none';
          }
          if (openBtn) {
            openBtn.style.display = '';
            openBtn.textContent = '<?php echo esc_js(__('Select Icon', 'acf-open-icons')); ?>';
          }
          if (clearBtn) clearBtn.style.display = 'none';
        }
        clearBtn && clearBtn.addEventListener('click', clear);
      })();
    </script>
<?php
  }

  public function format_value($value, $post_id, $field) {
    return is_array($value) ? $value : null;
  }
}
