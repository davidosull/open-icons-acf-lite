# Advanced Custom Fields: Open Icons

A powerful WordPress plugin that integrates popular open-source icon sets (Lucide, Tabler, Heroicons) with Advanced Custom Fields, providing a seamless icon selection experience with caching, sanitization, and stable rendering.

## Features

- **Multiple Icon Libraries**: Choose from Lucide, Tabler Icons, and Heroicons
- **Version Pinning**: Pin specific versions of icon sets for stability
- **Smart Caching**: Automatic caching of icons for improved performance
- **Color Token System**: Use palette tokens (A, B, C) for dynamic color management
- **Migration Tool**: Easily migrate icons between providers when switching icon sets
- **License Management**: Integrated licensing system for premium features
- **Automatic Updates**: Secure update delivery with license validation
- **ACF Integration**: Native ACF field type for seamless integration

## Requirements

- **WordPress**: 5.0 or higher
- **PHP**: 7.4 or higher (PHP 8.0+ recommended)
- **Advanced Custom Fields**: ACF Pro or ACF Free (version 5.0+)
- **License**: Valid license key required for full functionality

## Installation

1. Download the plugin ZIP file
2. Navigate to **Plugins > Add New** in your WordPress admin
3. Click **Upload Plugin** and select the ZIP file
4. Click **Install Now** and then **Activate**
5. Go to **Custom Fields > ACF Open Icons** to configure the plugin

## Configuration

### License Activation

1. Navigate to **Custom Fields > ACF Open Icons** in WordPress admin
2. Enter your license key in the **License** section
3. Click **Activate License**
4. Once activated, all plugin features will be available

### Icon Set Selection

1. Go to **Custom Fields > ACF Open Icons**
2. In the **Icon Set** section, select your preferred icon library:
   - **Lucide** - Modern, consistent icon set
   - **Tabler Icons** - Comprehensive icon collection
   - **Heroicons** - Beautiful hand-crafted SVG icons
3. Optionally pin a specific version for stability
4. Click **Save Changes**

### Color Palette

Configure color tokens that can be applied to icons:

1. In the **Palette** section, set colors for tokens A, B, and C
2. These tokens can be applied when selecting icons
3. Changing palette colors automatically updates all icons using those tokens

## Usage

### Creating an ACF Field

1. Go to **Custom Fields > Field Groups**
2. Create a new field group or edit an existing one
3. Add a new field and select **Open Icons** as the field type
4. Configure field settings (label, name, required, etc.)
5. Save the field group

### Displaying Icons in Templates

Use the `acf_open_icon()` helper function to display icons:

```php
<?php
$icon_field = get_field('icon_field');

// Basic usage
acf_open_icon($icon_field);

// With custom size
acf_open_icon($icon_field, [
    'size' => 32, // default: 24
]);

// Return instead of echo
$svg_markup = acf_open_icon($icon_field, [
    'size' => 64,
    'echo' => false,
]);
echo $svg_markup;

// With color override
acf_open_icon($icon_field, [
    'size' => 48,
    'color' => '#a7f3d0',  // Force a specific color
]);

// With CSS classes
acf_open_icon($icon_field, [
    'class' => 'icon-class-name',
    'size' => 32,
]);
?>
```

### Function Parameters

- `$value` (array|string): The icon field value from ACF
- `$atts` (array): Optional attributes:
  - `size` (int): Icon size in pixels (default: 24)
  - `color` (string): Hex color override (bypasses token-based color)
  - `class` (string): CSS class name(s) to add to the SVG
  - `echo` (bool): Whether to echo or return the markup (default: true)

## Icon Migration

When switching between icon providers, the plugin includes a migration tool to help update existing icons:

1. Go to **Custom Fields > ACF Open Icons**
2. Navigate to the **Migration** section
3. Review icons that need migration
4. Use the migration tool to automatically match and update icons to the new provider

## Updates

The plugin includes automatic update functionality:

- Updates are checked daily via WordPress cron
- Update notifications appear in the **Plugins** page
- Updates require a valid license (active or within grace period)
- Updates are delivered securely via proxy endpoint with license validation

## License

This is a proprietary plugin. A valid license key is required for:

- Accessing the icon picker
- Using plugin settings
- Receiving automatic updates
- Full plugin functionality

### License Status

- **Active**: License is valid and all features are available
- **Grace Period**: License expired but within 7-day grace period (features still work with warnings)
- **Expired**: License has expired and features are restricted

## Support

For support, feature requests, or bug reports, please contact:

- **Website**: [acfopenicons.com](https://acfopenicons.com)
- **Author**: David O'Sullivan
- **Author URI**: [osull.io](https://osull.io)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a complete list of changes and version history.

## Development

For developers who want to customize or extend the plugin:

1. Download the source ZIP file (`acf-open-icons-X.Y.Z-src.zip`)
2. Install dependencies: `npm install`
3. Build assets: `npm run build`
4. Create distribution packages: `npm run dist`

### File Structure

```
acf-open-icons/
├── acf-open-icons.php      # Main plugin file
├── includes/               # PHP classes
│   ├── class-acf-field-open-icons.php
│   ├── class-cache.php
│   ├── class-licence.php
│   ├── class-migration.php
│   ├── class-providers.php
│   ├── class-rest.php
│   ├── class-settings.php
│   └── ...
├── src/                    # React/TypeScript source
│   ├── picker.tsx
│   ├── settings.tsx
│   └── components/
├── assets/                 # Built assets
│   └── build/
└── USAGE_EXAMPLE.md        # Usage examples
```

## Credits

- **Icon Libraries**:
  - [Lucide](https://lucide.dev/)
  - [Tabler Icons](https://tabler.io/icons)
  - [Heroicons](https://heroicons.com/)

## Version

Current version: **0.6.0**

