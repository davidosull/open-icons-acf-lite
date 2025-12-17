<?php

namespace ACFOIL;

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
    $this->label    = __('Open Icons', 'acf-open-icons-lite');
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
      'label'        => __('Use Last Colour', 'acf-open-icons-lite'),
      'instructions' => __('When enabled, subsequent icon selections in the same context (repeater/flexible layout) will use the last selected colour.', 'acf-open-icons-lite'),
      'name'         => 'use_last_color',
      'type'         => 'true_false',
      'ui'           => 1,
      'default_value' => 1,
    ]);
  }

  public function render_field($field) {
    $settings = wp_parse_args(get_option('acf_open_icons_lite_settings', []), [
      'activeProvider' => 'heroicons',
      'pinnedVersion'  => 'latest',
    ]);

    $value   = is_array($field['value'] ?? null) ? $field['value'] : [];
    $stored  = $value['svg'] ?? '';
    $refKey  = esc_attr($value['iconKey'] ?? '');
    $pickerProv = esc_attr($settings['activeProvider']);
    $pickerVer  = esc_attr($settings['pinnedVersion']);
    $refProv = esc_attr((!empty($refKey) && isset($value['provider'])) ? $value['provider'] : $settings['activeProvider']);
    $refVer  = esc_attr((!empty($refKey) && isset($value['version'])) ? $value['version'] : $settings['pinnedVersion']);

    $color_token = $value['colorToken'] ?? null;
    if (!empty($color_token) && !empty($refKey) && !empty($stored)) {
      $palette = $settings['palette'] ?? [];
      $color_hex = null;

      if (is_array($palette)) {
        foreach ($palette as $item) {
          if (isset($item['token']) && $item['token'] === $color_token) {
            $color_hex = $item['hex'] ?? null;
            break;
          }
        }
      }

      if (!empty($color_hex)) {
        $base_svg = $this->cache->get_svg($refProv, $refVer, $refKey);
        if (!empty($base_svg)) {
          $has_stroke = preg_match('/\bstroke(?!-)\s*=/i', $base_svg);
          $has_fill = preg_match('/\bfill(?!-)\s*=/i', $base_svg) && !preg_match('/fill\s*=\s*["\']none["\']/i', $base_svg);

          $new_svg = $base_svg;

          if ($has_stroke) {
            $new_svg = preg_replace('/\bstroke(?!-)\s*=\s*["\']?[^"\'\s>]*["\']?/i', 'stroke="' . esc_attr($color_hex) . '"', $new_svg);
          }

          if ($has_fill) {
            $new_svg = preg_replace('/\bfill(?!-)\s*=\s*["\']?[^"\'\s>]*["\']?/i', 'fill="' . esc_attr($color_hex) . '"', $new_svg);
          }

          $stored = $new_svg;
        }
      }
    }

    $field_name = esc_attr($field['name']);
    $instance_id = uniqid('acfoil_', false);
    $has_icon = !empty($refKey) && !empty($stored);
    $use_last_color = !empty($field['use_last_color']) ? '1' : '0';

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

    $field_key = esc_attr($field['key'] ?? '');
?>
    <div class="acfoil-field" id="<?php echo esc_attr($instance_id); ?>"
      data-acfoil-provider="<?php echo $pickerProv; ?>"
      data-acfoil-version="<?php echo $pickerVer; ?>"
      data-acfoil-instance-id="<?php echo esc_attr($instance_id); ?>"
      data-acfoil-use-last-color="<?php echo $use_last_color; ?>"
      data-acfoil-field-key="<?php echo $field_key; ?>"
      data-acfoil-field-group-key="<?php echo esc_attr($field_group_key); ?>">
      <input type="hidden" name="<?php echo $field_name; ?>[provider]" value="<?php echo $refProv; ?>" data-acfoil-provider-out />
      <input type="hidden" name="<?php echo $field_name; ?>[version]" value="<?php echo $refVer; ?>" data-acfoil-version-out />
      <input type="hidden" name="<?php echo $field_name; ?>[iconKey]" value="<?php echo $refKey; ?>" data-acfoil-key-out />
      <input type="hidden" name="<?php echo $field_name; ?>[colorToken]" value="<?php echo esc_attr($value['colorToken'] ?? ''); ?>" data-acfoil-color-token-out />
      <textarea class="acf-hidden" name="<?php echo $field_name; ?>[svg]" data-acfoil-svg-out><?php echo esc_textarea($stored); ?></textarea>

      <div class="acfoil-preview-wrap" style="display:flex;align-items:center;gap:12px;">
        <div class="acfoil-preview" style="width:40px;height:40px;border:1px solid #ddd;border-radius:4px;display:flex;align-items:center;justify-content:center;background:#fff;line-height:0;<?php echo $has_icon ? '' : 'display:none;'; ?>" title="<?php esc_attr_e('Click to change icon', 'acf-open-icons-lite'); ?>" data-acfoil-preview>
          <?php echo $has_icon ? $stored : ''; ?>
        </div>
        <div class="acfoil-actions" style="display:flex;gap:8px;">
          <button class="button button-primary acfoil-select-button" type="button" data-acfoil-open><?php echo $has_icon ? esc_html__('Change Icon', 'acf-open-icons-lite') : esc_html__('Select Icon', 'acf-open-icons-lite'); ?></button>
          <button class="button" type="button" data-acfoil-clear style="<?php echo $has_icon ? '' : 'display:none;'; ?>"><?php esc_html_e('Remove', 'acf-open-icons-lite'); ?></button>
        </div>
      </div>
    </div>
    <script>
      (function() {
        const root = document.getElementById('<?php echo esc_js($instance_id); ?>');
        const clearBtn = root.querySelector('[data-acfoil-clear]');
        const openBtn = root.querySelector('[data-acfoil-open]');

        function clear() {
          root.querySelector('[data-acfoil-key-out]').value = '';
          root.querySelector('[data-acfoil-svg-out]').value = '';
          const tokenInput = root.querySelector('[data-acfoil-color-token-out]');
          if (tokenInput) tokenInput.value = '';
          const preview = root.querySelector('[data-acfoil-preview]');
          if (preview) {
            preview.innerHTML = '';
            preview.style.display = 'none';
          }
          if (openBtn) {
            openBtn.style.display = '';
            openBtn.textContent = '<?php echo esc_js(__('Select Icon', 'acf-open-icons-lite')); ?>';
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
