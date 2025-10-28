<?php

namespace ACFOI;

if (! defined('ABSPATH')) {
  exit;
}

class Providers {
  private $providers = [];

  public function __construct() {
    $this->providers = [
      'lucide'    => [
        'label'          => 'Lucide',
        'package'        => 'lucide-static',
        'defaultVersion' => 'latest',
        'licence'        => ['name' => 'ISC', 'url' => 'https://github.com/lucide-icons/lucide/blob/main/LICENSE'],
        'pathTemplate'   => 'icons/{key}.svg',
      ],
      'tabler'    => [
        'label'          => 'Tabler Icons',
        'package'        => '@tabler/icons',
        'defaultVersion' => 'latest',
        'licence'        => ['name' => 'MIT', 'url' => 'https://github.com/tabler/tabler-icons/blob/master/LICENSE'],
        'pathTemplate'   => 'icons/{key}.svg',
      ],
      'heroicons' => [
        'label'          => 'Heroicons',
        'package'        => 'heroicons',
        'defaultVersion' => 'latest',
        'licence'        => ['name' => 'MIT', 'url' => 'https://github.com/tailwindlabs/heroicons/blob/master/LICENSE'],
        'pathTemplate'   => '24/outline/{key}.svg',
      ],
    ];
  }

  public function all(): array {
    return $this->providers;
  }

  public function get(string $key): ?array {
    return $this->providers[$key] ?? null;
  }
}
