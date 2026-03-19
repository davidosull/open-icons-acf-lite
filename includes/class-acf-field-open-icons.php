<?php

namespace OPENICON;

if (! defined('ABSPATH')) {
  exit;
}

if (! class_exists('\\acf_field')) {
  return;
}

/**
 * ACF Open Icons field type.
 * Lite version - no license checks.
 */
class ACF_Field_Open_Icons extends \acf_field {
  private $providers;
  private $cache;
  private $sanitiser;

  public function __construct(Providers $providers, Cache $cache, Sanitiser $sanitiser) {
    $this->name     = 'open_icons';
    $this->label    = __('Open Icons', 'open-icons-acf');
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
      'label'        => __('Use Last Colour', 'open-icons-acf'),
      'instructions' => __('When enabled, subsequent icon selections in the same context (repeater/flexible layout) will use the last selected colour.', 'open-icons-acf'),
      'name'         => 'use_last_color',
      'type'         => 'true_false',
      'ui'           => 1,
      'default_value' => 1,
    ]);
  }

  public function render_field($field) {
    $settings = wp_parse_args(get_option('openicon_settings', []), [
      'activeProvider' => 'heroicons',
    ]);

    $settings['activeProvider'] = 'heroicons';

    $value   = is_array($field['value'] ?? null) ? $field['value'] : [];
    $stored  = $value['svg'] ?? '';
    $refKey  = esc_attr($value['iconKey'] ?? '');

    $pickerProv = 'heroicons';
    $pickerVer  = 'latest';
    $refProv = esc_attr((!empty($refKey) && isset($value['provider'])) ? $value['provider'] : 'heroicons');
    $refVer  = esc_attr((!empty($refKey) && isset($value['version'])) ? $value['version'] : 'latest');

    // If we have a colorToken, regenerate the SVG with current palette colour
    // This ensures the preview shows the current colour even if the stored SVG has old colour
    $color_token = $value['colorToken'] ?? null;
    if (!empty($color_token) && !empty($refKey) && !empty($stored)) {
      $palette = $settings['palette'] ?? [];
      $color_hex = null;

      // Find the current colour for this token
      if (is_array($palette)) {
        foreach ($palette as $item) {
          if (isset($item['token']) && $item['token'] === $color_token) {
            $color_hex = $item['hex'] ?? null;
            break;
          }
        }
      }

      // If we found a colour and it's different from what's in the stored SVG, regenerate
      if (!empty($color_hex)) {
        // Get base SVG from cache (without colour)
        $base_svg = $this->cache->get_svg($refProv, $refVer, $refKey);
        if (!empty($base_svg)) {
          // Apply current colour to base SVG
          $has_stroke = preg_match('/\bstroke(?!-)\s*=/i', $base_svg);
          $has_fill = preg_match('/\bfill(?!-)\s*=/i', $base_svg) && !preg_match('/fill\s*=\s*["\']none["\']/i', $base_svg);

          $new_svg = $base_svg;

          // Apply colour to stroke if present
          if ($has_stroke) {
            $new_svg = preg_replace('/\bstroke(?!-)\s*=\s*["\']?[^"\'\s>]*["\']?/i', 'stroke="' . esc_attr($color_hex) . '"', $new_svg);
          }

          // Apply colour to fill if present and not explicitly set to "none"
          if ($has_fill) {
            $new_svg = preg_replace('/\bfill(?!-)\s*=\s*["\']?[^"\'\s>]*["\']?/i', 'fill="' . esc_attr($color_hex) . '"', $new_svg);
          }

          // Use the regenerated SVG for preview
          $stored = $new_svg;
        }
      }
    }
    $field_name = esc_attr($field['name']);
    $instance_id = uniqid('openicon_', false);
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
    <div class="openicon-field" id="<?php echo esc_attr($instance_id); ?>"
      data-openicon-provider="<?php echo esc_attr($pickerProv); ?>"
      data-openicon-version="<?php echo esc_attr($pickerVer); ?>"
      data-openicon-instance-id="<?php echo esc_attr($instance_id); ?>"
      data-openicon-use-last-color="<?php echo esc_attr($use_last_color); ?>"
      data-openicon-field-key="<?php echo esc_attr($field_key); ?>"
      data-openicon-field-group-key="<?php echo esc_attr($field_group_key); ?>"
      data-openicon-picker-blocked="0">
      <input type="hidden" name="<?php echo esc_attr($field_name); ?>[provider]" value="<?php echo esc_attr($refProv); ?>" data-openicon-provider-out />
      <input type="hidden" name="<?php echo esc_attr($field_name); ?>[version]" value="<?php echo esc_attr($refVer); ?>" data-openicon-version-out />
      <input type="hidden" name="<?php echo esc_attr($field_name); ?>[iconKey]" value="<?php echo esc_attr($refKey); ?>" data-openicon-key-out />
      <input type="hidden" name="<?php echo esc_attr($field_name); ?>[colorToken]" value="<?php echo esc_attr($value['colorToken'] ?? ''); ?>" data-openicon-color-token-out />
      <textarea class="acf-hidden" name="<?php echo esc_attr($field_name); ?>[svg]" data-openicon-svg-out><?php echo esc_textarea($stored); ?></textarea>

      <div class="openicon-preview-wrap" style="display:flex;align-items:center;gap:12px;">
        <div class="openicon-preview" style="width:40px;height:40px;border:1px solid #ddd;border-radius:4px;display:flex;align-items:center;justify-content:center;background:#fff;line-height:0;<?php echo $has_icon ? '' : 'display:none;'; ?>" title="<?php esc_attr_e('Click to change icon', 'open-icons-acf'); ?>" data-openicon-preview>
          <?php echo $has_icon ? wp_kses($stored, openicon_get_allowed_svg_tags()) : ''; ?>
        </div>
        <div class="openicon-actions" style="display:flex;gap:8px;">
          <button class="button button-primary openicon-select-button" type="button" data-openicon-open><?php echo $has_icon ? esc_html__('Change Icon', 'open-icons-acf') : esc_html__('Select Icon', 'open-icons-acf'); ?></button>
          <button class="button" type="button" data-openicon-clear style="<?php echo $has_icon ? '' : 'display:none;'; ?>"><?php esc_html_e('Remove', 'open-icons-acf'); ?></button>
        </div>
      </div>
    </div>
<?php
  }

  public function format_value($value, $post_id, $field) {
    return is_array($value) ? $value : null;
  }
}
