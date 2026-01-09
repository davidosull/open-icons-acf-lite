<?php

namespace ACFOIL;

if (! defined('ABSPATH')) {
  exit;
}

/**
 * Icon cache for ACF Open Icons Lite.
 */
class Cache {
  private $providers;
  private $sanitiser;

  public function __construct(Providers $providers, Sanitiser $sanitiser) {
    $this->providers = $providers;
    $this->sanitiser = $sanitiser;
  }

  public function base_dir(): string {
    $uploads = wp_upload_dir();
    return trailingslashit($uploads['basedir']) . 'acf-open-icons/cache/';
  }

  public function path_for(string $provider, string $version, string $key): string {
    $dir = $this->base_dir() . $provider . '@' . $version . '/';
    wp_mkdir_p($dir);
    return $dir . $key . '.svg';
  }

  public function get_svg(string $provider, string $version, string $key): ?string {
    $file = $this->path_for($provider, $version, $key);
    if (file_exists($file)) {
      $svg = file_get_contents($file);
      if (strpos($svg, '\\"') !== false) {
        $svg = str_replace('\\"', '"', $svg);
        file_put_contents($file, $svg);
      }
      return $svg;
    }
    $svg = $this->fetch_and_store($provider, $version, $key);
    return $svg ?: null;
  }

  public function fetch_and_store(string $provider, string $version, string $key): ?string {
    $meta = $this->providers->get($provider);
    if (! $meta) {
      return null;
    }
    $cdn = $this->build_cdn_url($meta, $version, $key);

    $response = wp_remote_get($cdn, ['timeout' => 15]);

    if (is_wp_error($response)) {
      return null;
    }
    $code = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);
    if ($code !== 200 || empty($body)) {
      return null;
    }

    $sanitised = $this->sanitiser->sanitise($body);
    $sanitised = str_replace('\\"', '"', $sanitised);
    $file      = $this->path_for($provider, $version, $key);
    file_put_contents($file, $sanitised);
    return $sanitised;
  }

  /**
   * Fetch multiple icons and store them.
   * Returns array of [key => svg] for successfully fetched icons.
   *
   * @param string $provider Provider name.
   * @param string $version  Provider version.
   * @param array  $keys     Icon keys to fetch.
   * @return array Fetched SVGs keyed by icon key.
   */
  public function fetch_multiple_and_store(string $provider, string $version, array $keys): array {
    $meta = $this->providers->get($provider);
    if (! $meta) {
      return [];
    }

    // Filter out already cached icons
    $to_fetch = [];
    foreach ($keys as $key) {
      $file = $this->path_for($provider, $version, $key);
      if (! file_exists($file)) {
        $to_fetch[] = $key;
      }
    }

    if (empty($to_fetch)) {
      return [];
    }

    $results = [];

    // Fetch each icon using WordPress HTTP API
    foreach ($to_fetch as $key) {
      $url = $this->build_cdn_url($meta, $version, $key);
      $response = wp_remote_get($url, [
        'timeout' => 15,
      ]);

      if (is_wp_error($response)) {
        continue;
      }

      $code = wp_remote_retrieve_response_code($response);
      $body = wp_remote_retrieve_body($response);

      if ($code === 200 && ! empty($body)) {
        $sanitised = $this->sanitiser->sanitise($body);
        $sanitised = str_replace('\\"', '"', $sanitised);
        $file = $this->path_for($provider, $version, $key);
        $this->write_file($file, $sanitised);
        $results[$key] = $sanitised;
      }
    }

    return $results;
  }

  /**
   * Write content to a file using WP_Filesystem.
   *
   * @param string $file    File path.
   * @param string $content Content to write.
   * @return bool True on success.
   */
  private function write_file(string $file, string $content): bool {
    global $wp_filesystem;

    if (! function_exists('WP_Filesystem')) {
      require_once ABSPATH . 'wp-admin/includes/file.php';
    }

    if (! WP_Filesystem()) {
      // Fallback to direct file write if WP_Filesystem fails
      return (bool) file_put_contents($file, $content);
    }

    return $wp_filesystem->put_contents($file, $content, FS_CHMOD_FILE);
  }

  private function build_cdn_url(array $meta, string $version, string $key): string {
    $package = $meta['package'];
    $path    = str_replace('{key}', $key, $meta['pathTemplate']);
    $ver     = $version === 'latest' ? '' : '@' . $version;
    $path_trimmed = ltrim($path, '/');

    // Use jsdelivr for icon fetching
    return 'https://cdn.jsdelivr.net/npm/' . rawurlencode($package . $ver) . '/' . $path_trimmed;
  }

  public function purge(string $provider, string $version): void {
    $dir = $this->base_dir() . $provider . '@' . $version . '/';
    if (is_dir($dir)) {
      $this->rrmdir($dir);
    }
  }

  public function purge_all(): void {
    $base = $this->base_dir();
    if (! is_dir($base)) {
      return;
    }
    $items = @scandir($base);
    if (! $items) return;
    foreach ($items as $item) {
      if ($item === '.' || $item === '..') continue;
      $path = trailingslashit($base) . $item;
      if (is_dir($path)) {
        $this->rrmdir(trailingslashit($path));
      } else {
        wp_delete_file($path);
      }
    }
  }

  private function rrmdir(string $dir): void {
    global $wp_filesystem;

    $items = @scandir($dir);
    if (! $items) {
      return;
    }
    foreach ($items as $item) {
      if ($item === '.' || $item === '..') continue;
      $path = $dir . $item;
      if (is_dir($path)) {
        $this->rrmdir(trailingslashit($path));
      } else {
        wp_delete_file($path);
      }
    }

    // Use WP_Filesystem for rmdir
    if (! function_exists('WP_Filesystem')) {
      require_once ABSPATH . 'wp-admin/includes/file.php';
    }
    if (WP_Filesystem()) {
      $wp_filesystem->rmdir($dir);
    } else {
      @rmdir($dir); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
    }
  }

  public static function purge_all_directory(string $base_dir): void {
    global $wp_filesystem;

    if (! is_dir($base_dir)) {
      return;
    }
    $items = @scandir($base_dir);
    if (! $items) {
      return;
    }
    foreach ($items as $item) {
      if ($item === '.' || $item === '..') continue;
      $path = trailingslashit($base_dir) . $item;
      if (is_dir($path)) {
        self::purge_all_directory(trailingslashit($path));
      } else {
        wp_delete_file($path);
      }
    }

    // Use WP_Filesystem for rmdir
    if (! function_exists('WP_Filesystem')) {
      require_once ABSPATH . 'wp-admin/includes/file.php';
    }
    if (WP_Filesystem()) {
      $wp_filesystem->rmdir($base_dir);
    } else {
      @rmdir($base_dir); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
    }
  }
}
