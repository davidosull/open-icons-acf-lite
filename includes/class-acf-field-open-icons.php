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

  public function __construct(Providers $providers, Cache $cache, Sanitiser $sanitiser) {
    $this->name     = 'open_icons';
    $this->label    = __('Open Icons', 'acf-open-icons');
    $this->category = 'content';
    $this->defaults = [
      'use_last_color' => 1,
    ];

    $this->providers = $providers;
    $this->cache     = $cache;
    $this->sanitiser = $sanitiser;
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
    // If no icon selected yet, fall back to current settings for provider/version
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
?>
    <div class="acfoi-field" id="<?php echo esc_attr($instance_id); ?>"
      data-acfoi-provider="<?php echo $refProv; ?>"
      data-acfoi-version="<?php echo $refVer; ?>"
      data-acfoi-instance-id="<?php echo esc_attr($instance_id); ?>"
      data-acfoi-use-last-color="<?php echo $use_last_color; ?>"
      data-acfoi-field-key="<?php echo $field_key; ?>"
      data-acfoi-field-group-key="<?php echo esc_attr($field_group_key); ?>">
      <input type="hidden" name="<?php echo $field_name; ?>[provider]" value="<?php echo $refProv; ?>" data-acfoi-provider-out />
      <input type="hidden" name="<?php echo $field_name; ?>[version]" value="<?php echo $refVer; ?>" data-acfoi-version-out />
      <input type="hidden" name="<?php echo $field_name; ?>[iconKey]" value="<?php echo $refKey; ?>" data-acfoi-key-out />
      <input type="hidden" name="<?php echo $field_name; ?>[colorToken]" value="<?php echo esc_attr($value['colorToken'] ?? ''); ?>" data-acfoi-color-token-out />
      <textarea class="acf-hidden" name="<?php echo $field_name; ?>[svg]" data-acfoi-svg-out><?php echo esc_textarea($stored); ?></textarea>

      <div class="acfoi-preview-wrap" style="display:flex;align-items:center;gap:12px;">
        <div class="acfoi-preview" style="width:40px;height:40px;border:1px solid #ddd;border-radius:4px;display:flex;align-items:center;justify-content:center;background:#fff;line-height:0;<?php echo $has_icon ? '' : 'display:none;'; ?>" title="<?php esc_attr_e('Click to change icon', 'acf-open-icons'); ?>" data-acfoi-preview>
          <?php echo $has_icon ? $stored : ''; ?>
        </div>
        <div class="acfoi-actions" style="display:flex;gap:8px;">
          <button class="button button-primary acfoi-select-button" type="button" data-acfoi-open><?php echo $has_icon ? esc_html__('Change Icon', 'acf-open-icons') : esc_html__('Select Icon', 'acf-open-icons'); ?></button>
          <button class="button" type="button" data-acfoi-clear style="<?php echo $has_icon ? '' : 'display:none;'; ?>"><?php esc_html_e('Remove', 'acf-open-icons'); ?></button>
        </div>
      </div>
    </div>
    <script>
      (function() {
        const root = document.getElementById('<?php echo esc_js($instance_id); ?>');
        const clearBtn = root.querySelector('[data-acfoi-clear]');

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
          const openBtn = root.querySelector('[data-acfoi-open]');
          const clearBtn = root.querySelector('[data-acfoi-clear]');
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
