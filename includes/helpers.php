<?php

if (! defined('ABSPATH')) {
  exit;
}

/**
 * Display an icon from ACF Open Icons field.
 *
 * @param array|string $value   Required. ACF field value array (must contain 'svg' and optionally 'colorToken'), or legacy array with 'value' key.
 * @param array        $atts    Optional. Arguments to control icon display.
 *                              @type string $color Override color (hex code). If not provided and 'colorToken' exists, uses current settings.
 *                              @type int    $size  Icon size in pixels. Default 24.
 *                              @type string $class CSS class name(s) to add to the SVG element. Default empty.
 *                              @type bool   $echo  Whether to echo or return. Default true.
 * @return string|void SVG markup if $echo is false, otherwise echoes.
 */
function acf_open_icon($value = null, $atts = []) {
  // Backwards compatibility: detect if first param is an array with 'value' key
  if (is_array($value) && isset($value['value']) && ! isset($value['svg']) && ! isset($value['iconKey'])) {
    // Old API: acf_open_icon(['value' => $icon_field, 'size' => 32])
    $atts = $value;
    $value = $atts['value'] ?? null;
  }

  $atts = wp_parse_args($atts, [
    'color' => null,
    'size'  => 24,
    'class' => '',
    'echo'  => true,
  ]);

  if (! is_array($value)) {
    return $atts['echo'] ? '' : '';
  }

  $size   = (int) $atts['size'];
  $svg    = null;

  // Handle both iconKey (camelCase) and iconkey (lowercase) from database
  $iconKey = ! empty($value['iconKey']) ? $value['iconKey'] : (! empty($value['iconkey']) ? $value['iconkey'] : '');

  // If we have a stored SVG, use it (it should already have the correct color applied)
  // This is the most reliable approach - use what's stored
  if (! empty($value['svg'])) {
    $svg = $value['svg'];

    // Debug: Log original SVG before any processing
    error_log('ACF Open Icons: Original stored SVG (first 500 chars): ' . substr($svg, 0, 500));

    // Only apply color override if explicitly provided
    if (! empty($atts['color'])) {
      // Debug: Log before regex
      error_log('ACF Open Icons: Applying color override: ' . $atts['color']);
      error_log('ACF Open Icons: SVG before color regex (first 500 chars): ' . substr($svg, 0, 500));

      // Detect if icon uses fill or stroke (or both)
      // Some icon sets (e.g., Heroicons solid) use fill, others use stroke
      $has_stroke = preg_match('/\bstroke(?!-)\s*=/i', $svg);
      $has_fill = preg_match('/\bfill(?!-)\s*=/i', $svg) && !preg_match('/fill\s*=\s*["\']none["\']/i', $svg);

      // Apply color to stroke if present
      if ($has_stroke) {
        // Use negative lookahead to avoid matching stroke-width, stroke-linecap, etc.
        $svg = preg_replace('/\bstroke(?!-)\s*=\s*["\']?[^"\'\s>]*["\']?/i', 'stroke="' . esc_attr($atts['color']) . '"', $svg);
      }

      // Apply color to fill if present and not explicitly set to "none"
      if ($has_fill) {
        // Use negative lookahead to avoid matching fill-opacity, fill-rule, etc.
        $svg = preg_replace('/\bfill(?!-)\s*=\s*["\']?[^"\'\s>]*["\']?/i', 'fill="' . esc_attr($atts['color']) . '"', $svg);
      }

      // Debug: Log after regex
      error_log('ACF Open Icons: SVG after color regex (first 500 chars): ' . substr($svg, 0, 500));
    }
    // Otherwise, use stored SVG as-is (it should already have the correct color from colorToken)
  } elseif (! empty($value['colorToken']) && ! empty($value['provider']) && ! empty($iconKey)) {
    // Fallback: If no stored SVG but we have colorToken, fetch from cache and apply color
    // This handles edge cases where SVG wasn't stored
    $providers = new \ACFOI\Providers();
    $sanitiser = new \ACFOI\Sanitiser();
    $cache     = new \ACFOI\Cache($providers, $sanitiser);

    $provider = sanitize_key($value['provider']);
    $version  = sanitize_text_field($value['version'] ?? 'latest');
    $iconKey  = sanitize_title_with_dashes($iconKey);

    // Fetch original SVG from cache (without color applied)
    $svg = $cache->get_svg($provider, $version, $iconKey);

    if ($svg) {
      // Get current color from settings based on token (unless override provided)
      if (empty($atts['color'])) {
        $settings = get_option('acf_open_icons_settings', []);
        $palette  = $settings['palette'] ?? [];
        if (is_array($palette)) {
          foreach ($palette as $item) {
            if (isset($item['token']) && $item['token'] === $value['colorToken']) {
              $atts['color'] = $item['hex'] ?? null;
              break;
            }
          }
        }
      }

      // Apply color if we have one
      if (! empty($atts['color'])) {
        // Detect if icon uses fill or stroke (or both)
        $has_stroke = preg_match('/\bstroke(?!-)\s*=/i', $svg);
        $has_fill = preg_match('/\bfill(?!-)\s*=/i', $svg) && !preg_match('/fill\s*=\s*["\']none["\']/i', $svg);

        // Apply color to stroke if present
        if ($has_stroke) {
          // Use negative lookahead to avoid matching stroke-width, stroke-linecap, etc.
          $svg = preg_replace('/\bstroke(?!-)\s*=\s*["\']?[^"\'\s>]*["\']?/i', 'stroke="' . esc_attr($atts['color']) . '"', $svg);
        }

        // Apply color to fill if present and not explicitly set to "none"
        if ($has_fill) {
          // Use negative lookahead to avoid matching fill-opacity, fill-rule, etc.
          $svg = preg_replace('/\bfill(?!-)\s*=\s*["\']?[^"\'\s>]*["\']?/i', 'fill="' . esc_attr($atts['color']) . '"', $svg);
        }
      }
    }
  }

  if (empty($svg)) {
    return $atts['echo'] ? '' : '';
  }

  // Extract and modify only the <svg> opening tag's attributes
  // This ensures child elements (like <rect>, <circle>) keep their width/height attributes
  if (preg_match('/<svg\s+([^>]*)>/i', $svg, $matches)) {
    $attributes = $matches[1];

    // Debug: Log attributes before processing
    error_log('ACF Open Icons: Extracted SVG attributes: ' . $attributes);

    // Remove width, height, and viewBox only from the SVG element's attributes
    // (not from child elements - they need to keep their dimensions)
    // Use negative lookbehind to avoid matching "width" in "stroke-width", "min-width", etc.
    $attributes = preg_replace('/(?<!-)\bwidth\s*=\s*["\'][^"\']*["\']/i', '', $attributes);
    $attributes = preg_replace('/(?<!-)\bheight\s*=\s*["\'][^"\']*["\']/i', '', $attributes);

    // Debug: Log attributes after removing width/height
    error_log('ACF Open Icons: Attributes after removing width/height: ' . $attributes);

    // Preserve viewBox if it exists (it's important for SVG scaling)
    $viewbox = '';
    if (preg_match('/\bviewBox\s*=\s*["\']([^"\']*)["\']/i', $attributes, $viewbox_match)) {
      $viewbox = ' viewBox="' . esc_attr($viewbox_match[1]) . '"';
      // Remove viewBox from attributes string since we'll add it back separately
      $attributes = preg_replace('/\bviewBox\s*=\s*["\'][^"\']*["\']/i', '', $attributes);
    }

    // Prepare class attribute
    $class_attr = '';
    if (! empty($atts['class'])) {
      // Split by spaces and sanitize each class individually
      $class_parts = explode(' ', trim($atts['class']));
      $sanitized_classes = array_filter(array_map('sanitize_html_class', $class_parts));
      if (! empty($sanitized_classes)) {
        $class_attr = ' class="' . esc_attr(implode(' ', $sanitized_classes)) . '"';
      }
    }

    // Check if class already exists in attributes and merge if needed
    if (preg_match('/\bclass\s*=\s*["\']([^"\']*)["\']/i', $attributes, $class_match)) {
      // Merge with existing class
      $existing_classes = explode(' ', trim($class_match[1]));
      $new_classes = ! empty($atts['class']) ? explode(' ', trim($atts['class'])) : [];
      $all_classes = array_unique(array_merge($existing_classes, $new_classes));
      $all_classes = array_filter(array_map('sanitize_html_class', $all_classes));
      if (! empty($all_classes)) {
        $class_attr = ' class="' . esc_attr(implode(' ', $all_classes)) . '"';
        // Remove existing class attribute
        $attributes = preg_replace('/\bclass\s*=\s*["\'][^"\']*["\']/i', '', $attributes);
      }
    }

    // Clean up extra spaces in attributes
    $attributes = preg_replace('/\s+/', ' ', trim($attributes));

    // Debug: Log final attributes before reconstruction
    error_log('ACF Open Icons: Final attributes before reconstruction: ' . $attributes);

    // Reconstruct the <svg> tag with new size, preserved viewBox, class, and other attributes
    $new_svg_tag = '<svg width="' . $size . '" height="' . $size . '"' . $viewbox . $class_attr;
    if (! empty($attributes)) {
      $new_svg_tag .= ' ' . $attributes;
    }
    $new_svg_tag .= '>';

    // Debug: Log reconstructed tag
    error_log('ACF Open Icons: Reconstructed SVG tag: ' . $new_svg_tag);

    // Replace only the opening tag in the original SVG
    $svg = str_replace($matches[0], $new_svg_tag, $svg);

    // Debug: Log final SVG
    error_log('ACF Open Icons: Final SVG output (first 500 chars): ' . substr($svg, 0, 500));
  } else {
    // Fallback if no existing attributes - create minimal SVG tag
    $class_attr = '';
    if (! empty($atts['class'])) {
      $class_parts = explode(' ', trim($atts['class']));
      $sanitized_classes = array_filter(array_map('sanitize_html_class', $class_parts));
      if (! empty($sanitized_classes)) {
        $class_attr = ' class="' . esc_attr(implode(' ', $sanitized_classes)) . '"';
      }
    }
    $svg = preg_replace('/<svg\s*>/i', '<svg width="' . $size . '" height="' . $size . '"' . $class_attr . '>', $svg);
  }

  if ($atts['echo']) {
    echo $svg; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
  } else {
    return $svg;
  }
}

// Backwards compatibility
if (! function_exists('bic_icon')) {
  function bic_icon($value = null, $atts = []) {
    return acf_open_icon($value, $atts);
  }
}

