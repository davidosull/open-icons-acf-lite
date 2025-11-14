<?php

namespace ACFOI;

if (! defined('ABSPATH')) {
  exit;
}

class Licence {
  private $option_key = 'acfoi_licence';

  public function __construct() {
    add_action('admin_init', [$this, 'maybe_block_without_licence']);
  }

  public function is_valid(): bool {
    $licence = get_option($this->option_key);
    // TODO: Remote validation with licensing server and Lemon Squeezy integration.
    return ! empty($licence['status']) && $licence['status'] === 'active';
  }

  public function get_status(): array {
    return (array) get_option($this->option_key, []);
  }

  public function maybe_block_without_licence(): void {
    if (is_admin() && ! $this->is_valid()) {
      add_action('admin_notices', function () {
        echo '<div class="notice notice-error"><p>' . esc_html__('ACF: Open Icons requires an active licence. Please activate to use settings and picker.', 'acf-open-icons') . '</p></div>';
      });
    }
  }
}
