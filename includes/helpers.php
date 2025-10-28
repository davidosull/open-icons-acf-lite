<?php

if (! defined('ABSPATH')) {
  exit;
}

if (! function_exists('bic_icon')) {
  function bic_icon($args = []) {
    $args = wp_parse_args($args, [
      'value'    => null, // ACF value array
      'provider' => null,
      'key'      => null,
      'colour'   => null,
      'size'     => 24,
    ]);

    $svg = '';
    if (is_array($args['value']) && ! empty($args['value']['svg'])) {
      $svg = $args['value']['svg'];
    }

    if (empty($svg)) {
      return '';
    }

    $size_attr = (int) $args['size'];
    $colour    = $args['colour'];
    if ($colour) {
      $svg = preg_replace('/(stroke|fill)="(currentColor|#[0-9a-fA-F]{3,6})"/i', '$1="' . esc_attr($colour) . '"', $svg);
    }

    $svg = preg_replace('/(width|height)="[^"]*"/', '', $svg);
    $svg = preg_replace('/<svg /', '<svg width="' . $size_attr . '" height="' . $size_attr . '" ', $svg, 1);
    echo $svg; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
  }
}
