<?php

namespace ACFOI;

if (! defined('ABSPATH')) {
  exit;
}

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

  private function build_cdn_url(array $meta, string $version, string $key): string {
    $package = $meta['package'];
    $path    = str_replace('{key}', $key, $meta['pathTemplate']);
    $ver     = $version === 'latest' ? '' : '@' . $version;
    return 'https://cdn.jsdelivr.net/npm/' . rawurlencode($package . $ver) . '/' . ltrim($path, '/');
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
        @unlink($path);
      }
    }
  }

  private function rrmdir(string $dir): void {
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
        @unlink($path);
      }
    }
    @rmdir($dir);
  }

  public static function purge_all_directory(string $base_dir): void {
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
        @unlink($path);
      }
    }
    @rmdir($base_dir);
  }
}
