<?php

namespace ACFOIL;

if (! defined('ABSPATH')) {
  exit;
}

class Providers {
  private $providers = [];

  public function __construct() {
    $this->providers = [
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
