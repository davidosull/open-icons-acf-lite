<?php

namespace ACFOI;

if (! defined('ABSPATH')) {
  exit;
}

class Migration {
  private $providers;
  private $cache;
  private $rest;

  public function __construct(Providers $providers, Cache $cache, Rest $rest) {
    $this->providers = $providers;
    $this->cache     = $cache;
    $this->rest      = $rest;
  }

  /**
   * Find all icons stored in the database across all locations.
   *
   * @return array Array of icon locations with metadata, grouped by provider
   */
  public function find_all_icons(): array {
    $icons = [];

    // Find all ACF fields of type 'open_icons'
    $field_data = $this->get_open_icons_field_keys();
    $field_keys = $field_data['keys'] ?? [];
    $field_names = $field_data['names'] ?? [];

    // Query all meta locations with field keys/names
    $icons = array_merge($icons, $this->find_icons_in_postmeta($field_keys, $field_names));
    $icons = array_merge($icons, $this->find_icons_in_options($field_keys, $field_names));
    $icons = array_merge($icons, $this->find_icons_in_usermeta($field_keys, $field_names));
    $icons = array_merge($icons, $this->find_icons_in_termmeta($field_keys, $field_names));

    // Fallback: Also search for ANY serialized arrays containing icon data (in case field keys don't match)
    // This catches icons stored with different meta keys or orphaned icons
    $icons = array_merge($icons, $this->find_icons_by_content_in_postmeta());
    $icons = array_merge($icons, $this->find_icons_by_content_in_options());
    $icons = array_merge($icons, $this->find_icons_by_content_in_usermeta());
    $icons = array_merge($icons, $this->find_icons_by_content_in_termmeta());

    // Deduplicate by meta_id/object_id/meta_key combination
    $seen = [];
    $deduplicated = [];
    foreach ($icons as $icon) {
      $key = ($icon['type'] ?? '') . '|' . ($icon['meta_id'] ?? '') . '|' . ($icon['object_id'] ?? '') . '|' . ($icon['meta_key'] ?? '');
      if (!isset($seen[$key])) {
        $seen[$key] = true;
        $deduplicated[] = $icon;
      }
    }

    return $deduplicated;
  }

  /**
   * Find icons by provider.
   *
   * @param string $provider Provider key
   * @return array Array of icon locations for the specified provider
   */
  public function find_icons_by_provider(string $provider): array {
    $all_icons = $this->find_all_icons();
    return array_filter($all_icons, function ($icon) use ($provider) {
      return isset($icon['value']['provider']) && $icon['value']['provider'] === $provider;
    });
  }

  /**
   * Get migration status - icons grouped by provider.
   *
   * @param string $current_provider Current active provider
   * @return array Status with icons grouped by provider and unmatched icons
   */
  public function get_migration_status(string $current_provider): array {
    $all_icons = $this->find_all_icons();

    // Group icons by provider
    $by_provider = [];
    $non_current = [];

    foreach ($all_icons as $icon) {
      $provider = $icon['value']['provider'] ?? 'unknown';
      $icon_key = $icon['value']['iconKey'] ?? 'unknown';

      if (! isset($by_provider[$provider])) {
        $by_provider[$provider] = [];
      }
      $by_provider[$provider][] = $icon;

      // Track icons from non-current providers
      if ($provider !== $current_provider) {
        $non_current[] = $icon;
      }
    }

    return [
      'by_provider' => $by_provider,
      'non_current' => $non_current,
      'total' => count($all_icons),
    ];
  }

  /**
   * Get all ACF field keys of type 'open_icons'.
   *
   * @return array Array of field keys and names ['keys' => [...], 'names' => [...]]
   */
  private function get_open_icons_field_keys(): array {
    $field_keys = [];
    $field_names = [];

    if (! function_exists('acf_get_field_groups')) {
      return ['keys' => [], 'names' => []];
    }

    // Get all field groups
    $field_groups = acf_get_field_groups();
    foreach ($field_groups as $field_group) {
      $fields = acf_get_fields($field_group);
      if (! is_array($fields)) {
        continue;
      }
      $this->extract_field_keys_and_names_recursive($fields, $field_keys, $field_names);
    }

    return [
      'keys' => array_unique($field_keys),
      'names' => array_unique($field_names),
    ];
  }

  /**
   * Recursively extract field keys and names of type 'open_icons'.
   *
   * @param array $fields ACF fields array
   * @param array &$field_keys Reference to array to populate with keys
   * @param array &$field_names Reference to array to populate with names
   */
  private function extract_field_keys_and_names_recursive(array $fields, array &$field_keys, array &$field_names): void {
    foreach ($fields as $field) {
      if (isset($field['type']) && $field['type'] === 'open_icons') {
        if (isset($field['key'])) {
          $field_keys[] = $field['key'];
        }
        if (isset($field['name']) && ! empty($field['name'])) {
          $field_names[] = $field['name'];
        }
      }
      // Check sub fields (repeaters, flexible content, groups)
      if (isset($field['sub_fields']) && is_array($field['sub_fields'])) {
        $this->extract_field_keys_and_names_recursive($field['sub_fields'], $field_keys, $field_names);
      }
      if (isset($field['layouts']) && is_array($field['layouts'])) {
        foreach ($field['layouts'] as $layout) {
          if (isset($layout['sub_fields']) && is_array($layout['sub_fields'])) {
            $this->extract_field_keys_and_names_recursive($layout['sub_fields'], $field_keys, $field_names);
          }
        }
      }
    }
  }

  /**
   * Find icons in post meta.
   *
   * @param array $field_keys Array of ACF field keys
   * @param array $field_names Array of ACF field names
   * @return array Array of icon locations
   */
  private function find_icons_in_postmeta(array $field_keys, array $field_names): array {
    global $wpdb;
    $icons = [];

    if (empty($field_keys) && empty($field_names)) {
      return $icons;
    }

    // Build conditions for both field keys and field names
    $conditions = [];
    $params = [];

    // Add field keys (for direct matches and nested fields)
    if (! empty($field_keys)) {
      $key_placeholders = implode(',', array_fill(0, count($field_keys), '%s'));
      $conditions[] = "pm.meta_key IN ($key_placeholders)";
      $params = array_merge($params, $field_keys);

      // Build LIKE conditions for nested fields (e.g., field_123_0_field_456 for repeaters)
      foreach ($field_keys as $key) {
        $conditions[] = 'pm.meta_key LIKE %s';
        $params[] = $wpdb->esc_like($key) . '%';
      }
    }

    // Add field names (ACF stores values using field names, not keys)
    if (! empty($field_names)) {
      $name_placeholders = implode(',', array_fill(0, count($field_names), '%s'));
      $conditions[] = "pm.meta_key IN ($name_placeholders)";
      $params = array_merge($params, $field_names);

      // Also search for nested field names (e.g., repeater_field_0_icon_field)
      foreach ($field_names as $name) {
        $conditions[] = 'pm.meta_key LIKE %s';
        $params[] = $wpdb->esc_like($name) . '%';
      }
    }

    $where_clause = ! empty($conditions) ? '(' . implode(' OR ', $conditions) . ')' : '1=0';

    // Exclude post revisions - only get icons from actual posts (not revision posts)
    $query = $wpdb->prepare(
      "SELECT pm.meta_id, pm.post_id, pm.meta_key, pm.meta_value
       FROM {$wpdb->postmeta} pm
       INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
       WHERE $where_clause
       AND pm.meta_value != ''
       AND pm.meta_value != 'a:0:{}'
       AND p.post_type != 'revision'",
      ...$params
    );

    $results = $wpdb->get_results($query, ARRAY_A);
    if (! is_array($results)) {
      return $icons;
    }

    foreach ($results as $row) {
      $value = maybe_unserialize($row['meta_value']);
      if (! is_array($value) || empty($value['provider']) || empty($value['iconKey'])) {
        continue;
      }

      $post = get_post($row['post_id']);
      $icons[] = [
        'type'      => 'post_meta',
        'meta_id'   => (int) $row['meta_id'],
        'object_id' => (int) $row['post_id'],
        'meta_key'  => $row['meta_key'],
        'field_key' => $row['meta_key'],
        'value'     => $value,
        'post_title' => $post ? $post->post_title : '',
        'post_type'  => $post ? $post->post_type : '',
        'edit_link'  => $post ? get_edit_post_link($row['post_id'], 'raw') : '',
      ];
    }

    return $icons;
  }

  /**
   * Find icons in options (ACF options pages).
   *
   * @param array $field_keys Array of ACF field keys
   * @param array $field_names Array of ACF field names
   * @return array Array of icon locations
   */
  private function find_icons_in_options(array $field_keys, array $field_names): array {
    global $wpdb;
    $icons = [];

    if (empty($field_keys) && empty($field_names)) {
      return $icons;
    }

    // ACF stores options with 'options_' prefix for both keys and names
    $option_names = [];
    foreach ($field_keys as $key) {
      $option_names[] = 'options_' . $key;
    }
    foreach ($field_names as $name) {
      $option_names[] = 'options_' . $name;
    }

    if (empty($option_names)) {
      return $icons;
    }

    $placeholders = implode(',', array_fill(0, count($option_names), '%s'));
    $query = $wpdb->prepare(
      "SELECT option_id, option_name, option_value
       FROM {$wpdb->options}
       WHERE option_name IN ($placeholders)
       AND option_value != ''
       AND option_value != 'a:0:{}'",
      ...$option_names
    );

    $results = $wpdb->get_results($query, ARRAY_A);
    if (! is_array($results)) {
      return $icons;
    }

    foreach ($results as $row) {
      $value = maybe_unserialize($row['option_value']);
      if (! is_array($value) || empty($value['provider']) || empty($value['iconKey'])) {
        continue;
      }

      // Extract field key from option name (remove 'options_' prefix)
      $field_key = str_replace('options_', '', $row['option_name']);

      $icons[] = [
        'type'       => 'option',
        'meta_id'    => (int) $row['option_id'],
        'object_id'  => 0,
        'meta_key'   => $row['option_name'],
        'field_key'  => $field_key,
        'value'      => $value,
        'post_title' => __('Options Page', 'acf-open-icons'),
        'post_type'  => 'options',
        'edit_link'  => admin_url('admin.php?page=acf-options'),
      ];
    }

    return $icons;
  }

  /**
   * Find icons in user meta.
   *
   * @param array $field_keys Array of ACF field keys
   * @param array $field_names Array of ACF field names
   * @return array Array of icon locations
   */
  private function find_icons_in_usermeta(array $field_keys, array $field_names): array {
    global $wpdb;
    $icons = [];

    if (empty($field_keys) && empty($field_names)) {
      return $icons;
    }

    $all_keys = array_merge($field_keys, $field_names);
    if (empty($all_keys)) {
      return $icons;
    }

    $placeholders = implode(',', array_fill(0, count($all_keys), '%s'));
    $query = $wpdb->prepare(
      "SELECT umeta_id, user_id, meta_key, meta_value
       FROM {$wpdb->usermeta}
       WHERE meta_key IN ($placeholders)
       AND meta_value != ''
       AND meta_value != 'a:0:{}'",
      ...$all_keys
    );

    $results = $wpdb->get_results($query, ARRAY_A);
    if (! is_array($results)) {
      return $icons;
    }

    foreach ($results as $row) {
      $value = maybe_unserialize($row['meta_value']);
      if (! is_array($value) || empty($value['provider']) || empty($value['iconKey'])) {
        continue;
      }

      $user = get_userdata($row['user_id']);
      $icons[] = [
        'type'       => 'user_meta',
        'meta_id'    => (int) $row['umeta_id'],
        'object_id'  => (int) $row['user_id'],
        'meta_key'   => $row['meta_key'],
        'field_key'  => $row['meta_key'],
        'value'      => $value,
        'post_title' => $user ? $user->display_name : '',
        'post_type'  => 'user',
        'edit_link'  => $user ? get_edit_user_link($row['user_id']) : '',
      ];
    }

    return $icons;
  }

  /**
   * Find icons in term meta.
   *
   * @param array $field_keys Array of ACF field keys
   * @param array $field_names Array of ACF field names
   * @return array Array of icon locations
   */
  private function find_icons_in_termmeta(array $field_keys, array $field_names): array {
    global $wpdb;
    $icons = [];

    if (empty($field_keys) && empty($field_names)) {
      return $icons;
    }

    $all_keys = array_merge($field_keys, $field_names);
    if (empty($all_keys)) {
      return $icons;
    }

    $placeholders = implode(',', array_fill(0, count($all_keys), '%s'));
    $query = $wpdb->prepare(
      "SELECT meta_id, term_id, meta_key, meta_value
       FROM {$wpdb->termmeta}
       WHERE meta_key IN ($placeholders)
       AND meta_value != ''
       AND meta_value != 'a:0:{}'",
      ...$all_keys
    );

    $results = $wpdb->get_results($query, ARRAY_A);
    if (! is_array($results)) {
      return $icons;
    }

    foreach ($results as $row) {
      $value = maybe_unserialize($row['meta_value']);
      if (! is_array($value) || empty($value['provider']) || empty($value['iconKey'])) {
        continue;
      }

      $term = get_term($row['term_id']);
      $icons[] = [
        'type'       => 'term_meta',
        'meta_id'    => (int) $row['meta_id'],
        'object_id'  => (int) $row['term_id'],
        'meta_key'   => $row['meta_key'],
        'field_key'  => $row['meta_key'],
        'value'      => $value,
        'post_title' => $term ? $term->name : '',
        'post_type'  => $term ? $term->taxonomy : '',
        'edit_link'  => $term ? get_edit_term_link($row['term_id'], $term->taxonomy) : '',
      ];
    }

    return $icons;
  }

  /**
   * Find icons in postmeta by searching for serialized arrays containing icon data.
   * This is a fallback for when field keys/names don't match.
   *
   * @return array Array of icon locations
   */
  private function find_icons_by_content_in_postmeta(): array {
    global $wpdb;
    $icons = [];

    // Search for serialized arrays containing 'provider' and 'iconKey' keys
    // Look for patterns like: s:8:"provider" or "provider" (in serialized or JSON)
    // Exclude post revisions - only get icons from actual posts (not revision posts)
    $query = "SELECT pm.meta_id, pm.post_id, pm.meta_key, pm.meta_value
              FROM {$wpdb->postmeta} pm
              INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
              WHERE (pm.meta_value LIKE %s OR pm.meta_value LIKE %s)
              AND pm.meta_value != ''
              AND pm.meta_value != 'a:0:{}'
              AND p.post_type != 'revision'
              LIMIT 1000";

    $results = $wpdb->get_results($wpdb->prepare($query, '%"provider"%', '%s:8:"provider"%'), ARRAY_A);
    if (!is_array($results)) {
      return $icons;
    }

    foreach ($results as $row) {
      $value = maybe_unserialize($row['meta_value']);
      if (!is_array($value) || empty($value['provider']) || empty($value['iconKey'])) {
        continue;
      }

      // Skip if we already found this icon via field keys/names
      // (we'll deduplicate later, but this avoids unnecessary processing)
      $post = get_post($row['post_id']);
      $icons[] = [
        'type'      => 'post_meta',
        'meta_id'   => (int) $row['meta_id'],
        'object_id' => (int) $row['post_id'],
        'meta_key'  => $row['meta_key'],
        'field_key' => $row['meta_key'],
        'value'     => $value,
        'post_title' => $post ? $post->post_title : '',
        'post_type'  => $post ? $post->post_type : '',
        'edit_link'  => $post ? get_edit_post_link($row['post_id'], 'raw') : '',
      ];
    }

    return $icons;
  }

  /**
   * Find icons in options by searching for serialized arrays containing icon data.
   *
   * @return array Array of icon locations
   */
  private function find_icons_by_content_in_options(): array {
    global $wpdb;
    $icons = [];

    $query = "SELECT option_id, option_name, option_value
              FROM {$wpdb->options}
              WHERE (option_value LIKE %s OR option_value LIKE %s)
              AND option_value != ''
              AND option_value != 'a:0:{}'
              LIMIT 1000";

    $results = $wpdb->get_results($wpdb->prepare($query, '%"provider"%', '%s:8:"provider"%'), ARRAY_A);
    if (!is_array($results)) {
      return $icons;
    }

    foreach ($results as $row) {
      $value = maybe_unserialize($row['option_value']);
      if (!is_array($value) || empty($value['provider']) || empty($value['iconKey'])) {
        continue;
      }

      $field_key = str_replace('options_', '', $row['option_name']);
      $icons[] = [
        'type'       => 'option',
        'meta_id'    => (int) $row['option_id'],
        'object_id'  => 0,
        'meta_key'   => $row['option_name'],
        'field_key'  => $field_key,
        'value'      => $value,
        'post_title' => __('Options Page', 'acf-open-icons'),
        'post_type'  => 'options',
        'edit_link'  => admin_url('admin.php?page=acf-options'),
      ];
    }

    return $icons;
  }

  /**
   * Find icons in usermeta by searching for serialized arrays containing icon data.
   *
   * @return array Array of icon locations
   */
  private function find_icons_by_content_in_usermeta(): array {
    global $wpdb;
    $icons = [];

    $query = "SELECT umeta_id, user_id, meta_key, meta_value
              FROM {$wpdb->usermeta}
              WHERE (meta_value LIKE %s OR meta_value LIKE %s)
              AND meta_value != ''
              AND meta_value != 'a:0:{}'
              LIMIT 1000";

    $results = $wpdb->get_results($wpdb->prepare($query, '%"provider"%', '%s:8:"provider"%'), ARRAY_A);
    if (!is_array($results)) {
      return $icons;
    }

    foreach ($results as $row) {
      $value = maybe_unserialize($row['meta_value']);
      if (!is_array($value) || empty($value['provider']) || empty($value['iconKey'])) {
        continue;
      }

      $user = get_userdata($row['user_id']);
      $icons[] = [
        'type'       => 'user_meta',
        'meta_id'    => (int) $row['umeta_id'],
        'object_id'  => (int) $row['user_id'],
        'meta_key'   => $row['meta_key'],
        'field_key'  => $row['meta_key'],
        'value'      => $value,
        'post_title' => $user ? $user->display_name : '',
        'post_type'  => 'user',
        'edit_link'  => $user ? get_edit_user_link($row['user_id']) : '',
      ];
    }

    return $icons;
  }

  /**
   * Find icons in termmeta by searching for serialized arrays containing icon data.
   *
   * @return array Array of icon locations
   */
  private function find_icons_by_content_in_termmeta(): array {
    global $wpdb;
    $icons = [];

    $query = "SELECT meta_id, term_id, meta_key, meta_value
              FROM {$wpdb->termmeta}
              WHERE (meta_value LIKE %s OR meta_value LIKE %s)
              AND meta_value != ''
              AND meta_value != 'a:0:{}'
              LIMIT 1000";

    $results = $wpdb->get_results($wpdb->prepare($query, '%"provider"%', '%s:8:"provider"%'), ARRAY_A);
    if (!is_array($results)) {
      return $icons;
    }

    foreach ($results as $row) {
      $value = maybe_unserialize($row['meta_value']);
      if (!is_array($value) || empty($value['provider']) || empty($value['iconKey'])) {
        continue;
      }

      $term = get_term($row['term_id']);
      $icons[] = [
        'type'       => 'term_meta',
        'meta_id'    => (int) $row['meta_id'],
        'object_id'  => (int) $row['term_id'],
        'meta_key'   => $row['meta_key'],
        'field_key'  => $row['meta_key'],
        'value'      => $value,
        'post_title' => $term ? $term->name : '',
        'post_type'  => $term ? $term->taxonomy : '',
        'edit_link'  => $term ? get_edit_term_link($row['term_id'], $term->taxonomy) : '',
      ];
    }

    return $icons;
  }

  /**
   * Migrate icons from one provider to another.
   *
   * @param string $old_provider Old provider key
   * @param string $new_provider New provider key
   * @param string $new_version New version
   * @return array Migration results with matched_count and unmatched array
   */
  public function migrate_icons(string $old_provider, string $new_provider, string $new_version): array {
    if (! current_user_can('manage_options')) {
      return [
        'matched_count' => 0,
        'unmatched'     => [],
        'error'         => __('Insufficient permissions.', 'acf-open-icons'),
      ];
    }

    // Get all icons from old provider
    $old_provider_icons = $this->find_icons_by_provider($old_provider);

    if (empty($old_provider_icons)) {
      return [
        'matched_count' => 0,
        'unmatched'     => [],
        'total_found'   => 0,
      ];
    }

    // Get manifest for new provider
    $new_manifest = $this->get_provider_manifest($new_provider, $new_version);
    if (empty($new_manifest)) {
      return [
        'matched_count' => 0,
        'unmatched'     => array_values($old_provider_icons),
        'error'         => __('Failed to fetch manifest for new provider.', 'acf-open-icons'),
      ];
    }

    // Convert manifest to array for faster lookup
    $manifest_array = array_flip($new_manifest);

    $matched_count = 0;
    $unmatched     = [];

    foreach ($old_provider_icons as $icon) {
      $icon_key = $icon['value']['iconKey'] ?? '';
      if (empty($icon_key)) {
        $unmatched[] = $icon;
        continue;
      }

      // Check for exact match
      if (isset($manifest_array[$icon_key])) {
        // Update icon
        $updated = $this->update_icon_value($icon, $new_provider, $new_version);
        if ($updated) {
          $matched_count++;
        } else {
          $unmatched[] = $icon;
        }
      } else {
        $unmatched[] = $icon;
      }
    }

    return [
      'matched_count' => $matched_count,
      'unmatched'     => array_values($unmatched),
      'total_found'   => count($old_provider_icons),
    ];
  }

  /**
   * Get provider manifest.
   *
   * @param string $provider Provider key
   * @param string $version Version
   * @return array Array of icon keys
   */
  private function get_provider_manifest(string $provider, string $version): array {
    return $this->rest->fetch_manifest($provider, $version);
  }

  /**
   * Update icon value in database.
   *
   * @param array $location Icon location data
   * @param string $new_provider New provider key
   * @param string $new_version New version
   * @return bool Success
   */
  public function update_icon_value(array $location, string $new_provider, string $new_version): bool {
    global $wpdb;

    // Use the value from location (which may have been modified, e.g., iconKey changed)
    $value = $location['value'];

    // Get the new icon key (may have been changed in manual migration)
    $new_icon_key = $location['value']['iconKey'] ?? '';
    if (empty($new_icon_key)) {
      return false;
    }

    // Fetch the new SVG from the new provider (uncolored, from cache)
    $new_svg = $this->cache->get_svg($new_provider, $new_version, $new_icon_key);
    if (empty($new_svg)) {
      return false;
    }

    // Preserve colorToken if it exists
    $color_token = $location['value']['colorToken'] ?? null;

    // If colorToken exists, apply the color to the SVG before storing
    // This ensures backwards compatibility for code that uses the stored SVG directly
    if (!empty($color_token)) {
      $settings = get_option('acf_open_icons_settings', []);
      $palette = $settings['palette'] ?? [];
      $color_hex = null;

      // Find the color for this token
      if (is_array($palette)) {
        foreach ($palette as $item) {
          if (isset($item['token']) && $item['token'] === $color_token) {
            $color_hex = $item['hex'] ?? null;
            break;
          }
        }
      }

      // Apply color to SVG if we found a color for the token
      if (!empty($color_hex)) {
        // Detect if icon uses fill or stroke (or both)
        // Some icon sets (e.g., Heroicons solid) use fill, others use stroke
        $has_stroke = preg_match('/\bstroke(?!-)\s*=/i', $new_svg);
        $has_fill = preg_match('/\bfill(?!-)\s*=/i', $new_svg) && !preg_match('/fill\s*=\s*["\']none["\']/i', $new_svg);

        // Apply color to stroke if present
        if ($has_stroke) {
          // Use negative lookahead to avoid matching stroke-width, stroke-linecap, etc.
          $new_svg = preg_replace('/\bstroke(?!-)\s*=\s*["\']?[^"\'\s>]*["\']?/i', 'stroke="' . esc_attr($color_hex) . '"', $new_svg);
        }

        // Apply color to fill if present and not explicitly set to "none"
        if ($has_fill) {
          // Use negative lookahead to avoid matching fill-opacity, fill-rule, etc.
          $new_svg = preg_replace('/\bfill(?!-)\s*=\s*["\']?[^"\'\s>]*["\']?/i', 'fill="' . esc_attr($color_hex) . '"', $new_svg);
        }
      }
    }

    // Update all icon data
    $value['provider'] = $new_provider;
    $value['version']  = $new_version;
    $value['iconKey']  = $new_icon_key;
    $value['svg']      = $new_svg; // Store SVG with color applied if colorToken exists
    if (!empty($color_token)) {
      $value['colorToken'] = $color_token;
    }

    $serialized_value = maybe_serialize($value);

    switch ($location['type']) {
      case 'post_meta':
        $result = $wpdb->update(
          $wpdb->postmeta,
          ['meta_value' => $serialized_value],
          ['meta_id' => $location['meta_id']],
          ['%s'],
          ['%d']
        );
        return $result !== false;

      case 'option':
        $result = $wpdb->update(
          $wpdb->options,
          ['option_value' => $serialized_value],
          ['option_id' => $location['meta_id']],
          ['%s'],
          ['%d']
        );
        return $result !== false;

      case 'user_meta':
        $result = $wpdb->update(
          $wpdb->usermeta,
          ['meta_value' => $serialized_value],
          ['umeta_id' => $location['meta_id']],
          ['%s'],
          ['%d']
        );
        return $result !== false;

      case 'term_meta':
        $result = $wpdb->update(
          $wpdb->termmeta,
          ['meta_value' => $serialized_value],
          ['meta_id' => $location['meta_id']],
          ['%s'],
          ['%d']
        );
        return $result !== false;

      default:
        return false;
    }
  }

  /**
   * Update stored SVG for icons using specific color tokens.
   * Called when color tokens are changed in settings.
   *
   * @param array $changed_tokens Array of token keys that changed (e.g., ['C', 'A'])
   * @return array Results with updated_count
   */
  public function update_icons_by_color_tokens(array $changed_tokens): array {
    if (empty($changed_tokens) || ! current_user_can('manage_options')) {
      return ['updated_count' => 0];
    }

    // Get current settings to find new color values
    $settings = get_option('acf_open_icons_settings', []);
    $palette = $settings['palette'] ?? [];
    $palette_map = [];
    if (is_array($palette)) {
      foreach ($palette as $item) {
        if (isset($item['token']) && isset($item['hex'])) {
          $palette_map[$item['token']] = $item['hex'];
        }
      }
    }

    // Find all icons
    $all_icons = $this->find_all_icons();

    $updated_count = 0;

    foreach ($all_icons as $icon) {
      $color_token = $icon['value']['colorToken'] ?? null;

      // Skip if this icon doesn't use one of the changed tokens
      if (empty($color_token) || ! in_array($color_token, $changed_tokens, true)) {
        continue;
      }

      // Get the new color for this token
      $new_color_hex = $palette_map[$color_token] ?? null;
      if (empty($new_color_hex)) {
        continue;
      }

      // Get provider and version from icon
      $provider = $icon['value']['provider'] ?? '';
      $version = $icon['value']['version'] ?? 'latest';
      $icon_key = $icon['value']['iconKey'] ?? '';

      if (empty($provider) || empty($icon_key)) {
        continue;
      }

      // Fetch the base SVG (without color) from cache
      $base_svg = $this->cache->get_svg($provider, $version, $icon_key);
      if (empty($base_svg)) {
        continue;
      }

      // Apply the new color to the SVG
      $has_stroke = preg_match('/\bstroke(?!-)\s*=/i', $base_svg);
      $has_fill = preg_match('/\bfill(?!-)\s*=/i', $base_svg) && !preg_match('/fill\s*=\s*["\']none["\']/i', $base_svg);

      $new_svg = $base_svg;

      // Apply color to stroke if present
      if ($has_stroke) {
        $new_svg = preg_replace('/\bstroke(?!-)\s*=\s*["\']?[^"\'\s>]*["\']?/i', 'stroke="' . esc_attr($new_color_hex) . '"', $new_svg);
      }

      // Apply color to fill if present and not explicitly set to "none"
      if ($has_fill) {
        $new_svg = preg_replace('/\bfill(?!-)\s*=\s*["\']?[^"\'\s>]*["\']?/i', 'fill="' . esc_attr($new_color_hex) . '"', $new_svg);
      }

      // Update the icon value with new SVG
      $value = $icon['value'];
      $value['svg'] = $new_svg;
      $value['colorToken'] = $color_token; // Preserve token

      $serialized_value = maybe_serialize($value);

      // Update in database based on type
      global $wpdb;
      $updated = false;

      switch ($icon['type']) {
        case 'post_meta':
          $result = $wpdb->update(
            $wpdb->postmeta,
            ['meta_value' => $serialized_value],
            ['meta_id' => $icon['meta_id']],
            ['%s'],
            ['%d']
          );
          $updated = $result !== false;
          break;

        case 'option':
          $result = $wpdb->update(
            $wpdb->options,
            ['option_value' => $serialized_value],
            ['option_id' => $icon['meta_id']],
            ['%s'],
            ['%d']
          );
          $updated = $result !== false;
          break;

        case 'user_meta':
          $result = $wpdb->update(
            $wpdb->usermeta,
            ['meta_value' => $serialized_value],
            ['umeta_id' => $icon['meta_id']],
            ['%s'],
            ['%d']
          );
          $updated = $result !== false;
          break;

        case 'term_meta':
          $result = $wpdb->update(
            $wpdb->termmeta,
            ['meta_value' => $serialized_value],
            ['meta_id' => $icon['meta_id']],
            ['%s'],
            ['%d']
          );
          $updated = $result !== false;
          break;
      }

      if ($updated) {
        $updated_count++;
      }
    }

    return ['updated_count' => $updated_count];
  }
}
