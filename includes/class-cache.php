<?php

namespace OPENICON;

if (! defined('ABSPATH')) {
  exit;
}

/**
 * Icon file reader for ACF Open Icons Lite.
 * Reads bundled SVG icons from the plugin's assets/icons/ directory.
 */
class Cache {
  private $providers;

  public function __construct(Providers $providers) {
    $this->providers = $providers;
  }

  /**
   * Get the directory containing bundled icons.
   *
   * @return string Absolute path to icons directory.
   */
  private function icons_dir(): string {
    return OPENICON_PLUGIN_DIR . 'assets/icons/';
  }

  /**
   * Get SVG content for an icon.
   *
   * @param string $provider Provider key (only 'heroicons' in Lite).
   * @param string $version  Version string (ignored — icons are bundled).
   * @param string $key      Icon key (filename without .svg).
   * @return string|null SVG content or null if not found.
   */
  public function get_svg(string $provider, string $version, string $key): ?string {
    if (! $this->providers->get($provider)) {
      return null;
    }

    $file = $this->icons_dir() . $key . '.svg';

    if (! file_exists($file)) {
      return null;
    }

    $svg = file_get_contents($file);
    return $svg ?: null;
  }

  /**
   * Get the icon manifest (list of all available icon keys).
   *
   * @return array List of icon key strings.
   */
  public function get_manifest(): array {
    $manifest_file = $this->icons_dir() . 'manifest.json';

    if (! file_exists($manifest_file)) {
      return [];
    }

    $content = file_get_contents($manifest_file);
    if ($content === false) {
      return [];
    }

    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
  }
}
