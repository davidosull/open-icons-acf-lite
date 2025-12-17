# WordPress.org Plugin Assets

This folder contains assets for the WordPress.org plugin repository.
These files are uploaded separately via SVN and are NOT included in the plugin zip.

## Required Files

### Banners
- `banner-772x250.png` - Standard banner (required)
- `banner-1544x500.png` - Retina/HiDPI banner (recommended)

### Icons
- `icon-128x128.png` - Standard plugin icon (required)
- `icon-256x256.png` - Retina/HiDPI icon (recommended)

### Screenshots
Screenshots must match the numbers in readme.txt:
- `screenshot-1.png` - The icon picker modal showing available Heroicons
- `screenshot-2.png` - Plugin settings page with colour palette configuration
- `screenshot-3.png` - An ACF field with a selected icon

## Design Guidelines

### Banner
- Show the plugin name/logo
- Feature some example Heroicons
- Use brand colours (indigo/purple gradient works well)
- Keep text minimal and readable

### Icon
- Simple, recognisable design
- Works at small sizes
- Consider using a Heroicon as the main element

### Screenshots
- Use a clean WordPress install
- Show actual plugin functionality
- Crop to focus on relevant areas
- Ensure text is readable

## Uploading to WordPress.org

After plugin approval, upload via SVN to:
`https://plugins.svn.wordpress.org/acf-open-icons-lite/assets/`
