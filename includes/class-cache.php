<?php

namespace ACFOIL;

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
    return trailingslashit($uploads['basedir']) . 'acf-open-icons-lite/cache/';
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
    $fetch_start = microtime(true);
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
      // Try alternative URL encoding if the first attempt failed
      if ($code === 404) {
        $alt_cdn = $this->build_cdn_url_alternative($meta, $version, $key);
        if ($alt_cdn !== $cdn) {
          $alt_response = wp_remote_get($alt_cdn, ['timeout' => 15]);
          if (! is_wp_error($alt_response)) {
            $alt_code = wp_remote_retrieve_response_code($alt_response);
            $alt_body = wp_remote_retrieve_body($alt_response);
            if ($alt_code === 200 && ! empty($alt_body)) {
              $sanitised = $this->sanitiser->sanitise($alt_body);
              $sanitised = str_replace('\\"', '"', $sanitised);
              $file      = $this->path_for($provider, $version, $key);
              file_put_contents($file, $sanitised);
              return $sanitised;
            }
          }
        }
      }
      return null;
    }

    $sanitised = $this->sanitiser->sanitise($body);
    $sanitised = str_replace('\\"', '"', $sanitised);
    $file      = $this->path_for($provider, $version, $key);
    file_put_contents($file, $sanitised);
    return $sanitised;
  }

  /**
   * Fetch multiple icons in parallel using curl_multi_exec
   * Returns array of [key => svg] for successfully fetched icons
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

    // Build URLs for all icons
    $urls = [];
    foreach ($to_fetch as $key) {
      $urls[$key] = $this->build_cdn_url($meta, $version, $key);
    }

    // Use curl_multi for parallel requests
    $multi_handle = curl_multi_init();
    $curl_handles = [];
    $results = [];

    // Create curl handles for each URL
    foreach ($urls as $key => $url) {
      $ch = curl_init($url);
      curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT => 'WordPress/' . get_bloginfo('version') . '; ' . home_url(),
      ]);
      curl_multi_add_handle($multi_handle, $ch);
      $curl_handles[$key] = $ch;
    }

    // Execute all requests in parallel
    $running = null;
    do {
      $status = curl_multi_exec($multi_handle, $running);
      if ($running > 0) {
        curl_multi_select($multi_handle, 0.1); // Wait for activity
      }
    } while ($running > 0 && $status === CURLM_OK);

    // Process results
    foreach ($curl_handles as $key => $ch) {
      $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
      $body = curl_multi_getcontent($ch);
      $error = curl_error($ch);
      $url = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);

      if ($error) {
        curl_multi_remove_handle($multi_handle, $ch);
        curl_close($ch);
        continue;
      }

      if ($http_code === 200 && ! empty($body)) {
        $sanitised = $this->sanitiser->sanitise($body);
        $sanitised = str_replace('\\"', '"', $sanitised);
        $file = $this->path_for($provider, $version, $key);
        file_put_contents($file, $sanitised);
        $results[$key] = $sanitised;
      } else {
        // Try alternative URL for 404 errors
        if ($http_code === 404) {
          $alt_url = $this->build_cdn_url_alternative($meta, $version, $key);
          if ($alt_url !== $url) {
            $alt_ch = curl_init($alt_url);
            curl_setopt_array($alt_ch, [
              CURLOPT_RETURNTRANSFER => true,
              CURLOPT_FOLLOWLOCATION => true,
              CURLOPT_TIMEOUT => 15,
              CURLOPT_CONNECTTIMEOUT => 10,
              CURLOPT_SSL_VERIFYPEER => true,
              CURLOPT_USERAGENT => 'WordPress/' . get_bloginfo('version') . '; ' . home_url(),
            ]);
            $alt_body = curl_exec($alt_ch);
            $alt_http_code = curl_getinfo($alt_ch, CURLINFO_HTTP_CODE);
            curl_close($alt_ch);

            if ($alt_http_code === 200 && ! empty($alt_body)) {
              $sanitised = $this->sanitiser->sanitise($alt_body);
              $sanitised = str_replace('\\"', '"', $sanitised);
              $file = $this->path_for($provider, $version, $key);
              file_put_contents($file, $sanitised);
              $results[$key] = $sanitised;
            }
          }
        }
      }

      curl_multi_remove_handle($multi_handle, $ch);
      curl_close($ch);
    }

    curl_multi_close($multi_handle);

    return $results;
  }

  private function build_cdn_url(array $meta, string $version, string $key): string {
    $package = $meta['package'];
    $path    = str_replace('{key}', $key, $meta['pathTemplate']);
    $ver     = $version === 'latest' ? '' : '@' . $version;

    // For Tabler Icons, icons are in outline/ and filled/ subdirectories
    // Try outline first (default style), then filled as fallback
    if ($package === '@tabler/icons') {
      // Try outline first (default)
      $path_outline = str_replace('icons/', 'icons/outline/', $path);
      $path_trimmed = ltrim($path_outline, '/');
    } else {
      $path_trimmed = ltrim($path, '/');
    }

    // Use jsdelivr for icon fetching (more reliable than unpkg)
    // For scoped packages like @tabler/icons, jsdelivr needs the @scope/package unencoded
    // Format: https://cdn.jsdelivr.net/npm/@scope/package@version/path
    if (strpos($package, '@') === 0) {
      // Scoped package - don't encode @scope/package part, jsdelivr handles it
      return 'https://cdn.jsdelivr.net/npm/' . $package . $ver . '/' . $path_trimmed;
    } else {
      // Regular package - encode normally
      return 'https://cdn.jsdelivr.net/npm/' . rawurlencode($package . $ver) . '/' . $path_trimmed;
    }
  }

  /**
   * Build alternative CDN URL - try filled variant for Tabler, or unpkg for others
   * Fallback if outline variant doesn't work
   */
  private function build_cdn_url_alternative(array $meta, string $version, string $key): string {
    $package = $meta['package'];
    $path    = str_replace('{key}', $key, $meta['pathTemplate']);
    $ver     = $version === 'latest' ? '' : '@' . $version;

    // For Tabler Icons, try filled variant as fallback
    if ($package === '@tabler/icons') {
      $path_filled = str_replace('icons/', 'icons/filled/', $path);
      $path_trimmed = ltrim($path_filled, '/');
      return 'https://cdn.jsdelivr.net/npm/' . $package . $ver . '/' . $path_trimmed;
    } else {
      // For other providers, try unpkg as fallback
      $path_trimmed = ltrim($path, '/');
      return 'https://unpkg.com/' . $package . $ver . '/' . $path_trimmed;
    }
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
