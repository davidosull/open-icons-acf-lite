<?php

namespace ACFOIL;

if (! defined('ABSPATH')) {
  exit;
}

/**
 * SVG sanitiser for ACF Open Icons Lite.
 */
class Sanitiser {
  private $allowed_tags = ['svg', 'path', 'g', 'defs', 'use', 'clipPath', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse'];
  private $allowed_attrs = ['xmlns', 'viewBox', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'd', 'x', 'y', 'cx', 'cy', 'r', 'x1', 'x2', 'y1', 'y2', 'points'];

  public function sanitise(string $svg): string {
    $svg = $this->normalize_xml_header($svg);

    $dom = new \DOMDocument();
    $dom->preserveWhiteSpace = false;
    $dom->formatOutput = false;
    libxml_use_internal_errors(true);
    $loaded = $dom->loadXML($svg, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING);
    libxml_clear_errors();
    if (! $loaded) {
      return '';
    }

    $this->sanitize_node($dom->documentElement);

    if (! $dom->documentElement->hasAttribute('width')) {
      $dom->documentElement->setAttribute('width', '24');
    }
    if (! $dom->documentElement->hasAttribute('height')) {
      $dom->documentElement->setAttribute('height', '24');
    }

    $out = $dom->saveXML($dom->documentElement);
    // Guarantee plain quotes (no backslashes) and trim.
    $out = str_replace('\\"', '"', $out);
    return trim($out);
  }

  private function sanitize_node(\DOMNode $node): void {
    // Remove disallowed tags (script/style/foreignObject etc.).
    if ($node->nodeType === XML_ELEMENT_NODE) {
      $tag = $node->nodeName;
      if (! in_array($tag, $this->allowed_tags, true)) {
        $node->parentNode && $node->parentNode->removeChild($node);
        return;
      }
      // Remove common background box path used by some sets
      if ($tag === 'path' && $node->attributes && $node->attributes->getNamedItem('d')) {
        $d = trim($node->attributes->getNamedItem('d')->nodeValue);
        // Matches the invisible 24x24 box path: M0 0h24v24H0z (allow minor spacing variations)
        if (preg_match('/^M\s*0\s*0\s*h\s*24\s*v\s*24\s*H\s*0\s*z$/i', $d)) {
          $node->parentNode && $node->parentNode->removeChild($node);
          return;
        }
      }
      if ($tag === 'rect' && $node->attributes) {
        $x = $node->attributes->getNamedItem('x')?->nodeValue ?? '0';
        $y = $node->attributes->getNamedItem('y')?->nodeValue ?? '0';
        $w = $node->attributes->getNamedItem('width')?->nodeValue ?? '';
        $h = $node->attributes->getNamedItem('height')?->nodeValue ?? '';
        if (trim($x) === '0' && trim($y) === '0' && trim($w) === '24' && trim($h) === '24') {
          $node->parentNode && $node->parentNode->removeChild($node);
          return;
        }
      }

      // Strip disallowed attributes and any event handlers.
      if ($node->hasAttributes()) {
        $toRemove = [];
        foreach (iterator_to_array($node->attributes) as $attr) {
          $name = $attr->nodeName;
          if (stripos($name, 'on') === 0) {
            $toRemove[] = $name;
            continue;
          }
          if (! in_array($name, $this->allowed_attrs, true)) {
            $toRemove[] = $name;
            continue;
          }
          // Disallow url() and remote hrefs in attribute values.
          if (preg_match('/url\s*\(/i', $attr->nodeValue)) {
            $toRemove[] = $name;
            continue;
          }
        }
        foreach ($toRemove as $n) {
          $node->removeAttribute($n);
        }
      }
    }
    // Recurse into children.
    for ($i = $node->childNodes->length - 1; $i >= 0; $i--) {
      $child = $node->childNodes->item($i);
      if ($child->nodeType === XML_ELEMENT_NODE || $child->nodeType === XML_CDATA_SECTION_NODE) {
        $this->sanitize_node($child);
      }
      // Remove comments.
      if ($child->nodeType === XML_COMMENT_NODE) {
        $node->removeChild($child);
      }
    }
  }

  private function normalize_xml_header(string $svg): string {
    $svg = trim($svg);
    // Ensure an XML root without a duplicate xml declaration to help DOMDocument parse.
    $svg = preg_replace('/^\xEF\xBB\xBF/', '', $svg); // strip UTF-8 BOM
    return $svg;
  }
}
