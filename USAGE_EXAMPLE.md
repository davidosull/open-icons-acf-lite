# ACF Open Icons - Usage Example

## Display an Icon on Front-End

```php
<?php
$icon_field = get_field('icon_field');

// Basic usage
acf_open_icon($icon_field);

// Or with size control
acf_open_icon($icon_field, [
    'size' => 32, // default: 24
]);

// Or return instead of echo
$svg_markup = acf_open_icon($icon_field, [
    'size' => 64,
    'echo' => false,
]);
echo $svg_markup;

// With color override (bypasses token-based color)
acf_open_icon($icon_field, [
    'size' => 48,
    'color' => '#a7f3d0',  // Force a specific color
]);

// With CSS class name(s)
acf_open_icon($icon_field, [
    'class' => 'icon-class-name',
]);

// With multiple classes
acf_open_icon($icon_field, [
    'class' => 'icon-class another-class',
    'size' => 32,
]);
?>
```

## How Dynamic Colors Work

When an icon is selected, it stores:

- `iconKey` - The icon name (e.g., "check-circle")
- `provider` - The icon library (e.g., "lucide")
- `version` - The version used
- `colorToken` - The palette token (A, B, or C) used when selected
- `svg` - The SVG with color applied (for backwards compatibility)

When you call `acf_open_icon()` with a `colorToken`:

1. It fetches the original SVG from cache (without color)
2. Looks up the current color for that token from settings
3. Applies that color to the SVG
4. This means if you change Token C's color in settings, all icons using Token C automatically update!
