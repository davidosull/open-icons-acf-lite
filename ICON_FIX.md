# Icon Display Fix

## Problem

When displaying icons using the `acf_open_icon()` function, child SVG elements (like `<rect>`) were losing their `width` and `height` attributes, causing icons to render incorrectly or appear cut off.

For example, a `<rect>` element with `width="16" height="20"` would have these attributes stripped, resulting in a `0x0` rectangle that couldn't be seen.

## Root Cause

The original code used a global regex replacement that removed `width` and `height` attributes from **all elements** in the SVG, not just the root `<svg>` element:

```php
$svg = preg_replace('/(?<!stroke-)(?<!fill-)\b(width|height)\s*=\s*["\'][^"\']*["\']/', '', $svg);
```

This regex matched `width` and `height` anywhere in the SVG markup, including on child elements like `<rect>`, `<circle>`, etc.

## Solution

The fix extracts only the `<svg>` opening tag's attributes, modifies just those attributes, and then reconstructs the SVG tag. This ensures child elements remain untouched:

1. Extract the `<svg>` opening tag and its attributes
2. Remove `width`, `height`, and `viewBox` only from the SVG element's attributes
3. Preserve the `viewBox` if it exists
4. Reconstruct the `<svg>` tag with the new size and preserved `viewBox`
5. Replace only the opening tag in the original SVG

This approach ensures that child elements like `<rect width="16" height="20">` keep their dimensions intact while only the root SVG element's size is modified for display purposes.

