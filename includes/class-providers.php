<?php

namespace ACFOIL;

if (! defined('ABSPATH')) {
  exit;
}

/**
 * Icon providers registry.
 * Lite version only includes Heroicons.
 */
class Providers {
  private $providers = [];

  public function __construct() {
    $this->providers = [
      'heroicons' => [
        'label'          => 'Heroicons',
        'package'        => 'heroicons',
        'defaultVersion' => 'latest',
        'licence'        => [
          'name' => 'MIT',
          'url'  => 'https://github.com/tailwindlabs/heroicons/blob/master/LICENSE',
        ],
        'pathTemplate'   => '24/outline/{key}.svg',
        'iconCount'      => 292,
      ],
    ];
  }

  /**
   * Get all providers.
   *
   * @return array
   */
  public function all(): array {
    return $this->providers;
  }

  /**
   * Get a specific provider by key.
   *
   * @param string $key Provider key.
   * @return array|null
   */
  public function get(string $key): ?array {
    return $this->providers[$key] ?? null;
  }

  /**
   * Get the default provider key.
   *
   * @return string
   */
  public function get_default(): string {
    return 'heroicons';
  }

  /**
   * Get premium providers (for upsell display).
   *
   * @return array
   */
  public function get_premium_providers(): array {
    return [
      'lucide' => [
        'label'     => 'Lucide',
        'iconCount' => 1500,
        'premium'   => true,
      ],
      'tabler' => [
        'label'     => 'Tabler Icons',
        'iconCount' => 5200,
        'premium'   => true,
      ],
    ];
  }
}
