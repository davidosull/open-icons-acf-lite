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
    $this->defaults = [];

    $this->providers = $providers;
    $this->cache     = $cache;
    $this->sanitiser = $sanitiser;
    parent::__construct();
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
    $instance_id = uniqid('abi_', false);
    $has_icon = !empty($refKey) && !empty($stored);
?>
    <div class="abi-field" id="<?php echo esc_attr($instance_id); ?>"
      data-abi-provider="<?php echo $refProv; ?>"
      data-abi-version="<?php echo $refVer; ?>"
      data-abi-instance-id="<?php echo esc_attr($instance_id); ?>">
      <input type="hidden" name="<?php echo $field_name; ?>[provider]" value="<?php echo $refProv; ?>" data-abi-provider-out />
      <input type="hidden" name="<?php echo $field_name; ?>[version]" value="<?php echo $refVer; ?>" data-abi-version-out />
      <input type="hidden" name="<?php echo $field_name; ?>[iconKey]" value="<?php echo $refKey; ?>" data-abi-key-out />
      <textarea class="acf-hidden" name="<?php echo $field_name; ?>[svg]" data-abi-svg-out><?php echo esc_textarea($stored); ?></textarea>

      <div class="abi-preview-wrap" style="display:flex;align-items:center;gap:12px;">
        <div class="abi-preview" style="width:40px;height:40px;border:1px solid #ddd;border-radius:4px;display:flex;align-items:center;justify-content:center;background:#fff;line-height:0;<?php echo $has_icon ? '' : 'display:none;'; ?>" title="<?php esc_attr_e('Click to change icon', 'acf-open-icons'); ?>" data-abi-preview>
          <?php echo $has_icon ? $stored : ''; ?>
        </div>
        <div class="abi-actions" style="display:flex;gap:8px;">
          <button class="button button-primary abi-select-button" type="button" data-abi-open><?php echo $has_icon ? esc_html__('Change Icon', 'acf-open-icons') : esc_html__('Select Icon', 'acf-open-icons'); ?></button>
          <button class="button" type="button" data-abi-clear style="<?php echo $has_icon ? '' : 'display:none;'; ?>"><?php esc_html_e('Remove', 'acf-open-icons'); ?></button>
        </div>
      </div>
    </div>
    <script>
      (function() {
        const root = document.getElementById('<?php echo esc_js($instance_id); ?>');
        const clearBtn = root.querySelector('[data-abi-clear]');

        function clear() {
          root.querySelector('[data-abi-key-out]').value = '';
          root.querySelector('[data-abi-svg-out]').value = '';
          const preview = root.querySelector('[data-abi-preview]');
          if (preview) {
            preview.innerHTML = '';
            preview.style.display = 'none';
          }
          const openBtn = root.querySelector('[data-abi-open]');
          const clearBtn = root.querySelector('[data-abi-clear]');
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
