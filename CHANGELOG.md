# Changelog

## [0.2.0] - 2024

### Added

#### Features
- **"Use Last Color" Feature**: Added field-level setting to remember and automatically apply the last selected color for subsequent icon selections within the same context (repeater field or flexible content layout). This significantly improves workflow when adding multiple icons with the same color.
  - Context-aware: Repeater fields share the last color, while flexible content layouts are independent
  - Stored in localStorage per context for persistence across page loads
  - Default enabled for new fields
  - Can be toggled per field in ACF field settings

- **Close Button**: Added close button (×) in the top-right corner of the icon picker modal for better UX.

- **Apply & Close Button**: Added "Apply & Close" button in the "Current Icon Preview" section that allows users to apply a new color to the currently selected icon without closing the modal first. This streamlines the color update workflow.

- **CSS Class Support**: Added `class` parameter to `acf_open_icon()` helper function to allow adding custom CSS classes to SVG icons.
  ```php
  acf_open_icon($icon_field, [
      'class' => 'icon-class-name',
      'size' => 32,
  ]);
  ```
  - Supports single or multiple classes
  - Automatically merges with existing classes if SVG already has them
  - Properly sanitized for security

#### Performance Improvements
- **Parallel CDN Fetching**: Implemented parallel icon fetching using `curl_multi_exec` to fetch multiple icons from CDN simultaneously instead of sequentially. This dramatically reduces the time to load icons on first filter/search (from ~15 seconds to ~2 seconds for 45 icons).
- **Removed Icon Count Limits**: Removed hardcoded limits that were preventing all icons from loading. The icon picker now displays all available icons (1860+ icons) instead of stopping at ~527.
- **Optimized Icon Loading**:
  - First 24 icons are eager-loaded when modal opens for immediate display
  - Remaining icons are lazy-loaded as user scrolls
  - Removed "common icons" concept - all icons are now available from the start

### Fixed

- **Asset Loading**: Fixed styles and scripts not loading in both development (`npm start`) and production (`npm run build`) modes. Improved Vite manifest parsing and CSS collection from nested imports.

- **Dynamic Field Support**: Fixed "Remove Icon" button not working for dynamically added fields (e.g., in flexible content layouts or repeater fields added after page load). Implemented event delegation to handle dynamically added DOM elements.

- **Modal Scrolling**: Fixed issue where scrolling in the icon picker modal would jump back to the top. The issue was caused by mouse hover events triggering `scrollIntoView`. Now only keyboard navigation triggers scrolling.

- **Color Flash**: Fixed visual flash where the default color (Token A) would briefly appear before the last used color was applied when opening the modal. Color is now initialized synchronously before the modal renders.

- **SVG Attribute Preservation**: Fixed critical bug where `width` and `height` attributes were being stripped from child SVG elements (like `<rect>`, `<circle>`) when using `acf_open_icon()`. The fix ensures only the root `<svg>` element's dimensions are modified while preserving all child element attributes.
  - Preserves `viewBox` attribute for proper SVG scaling
  - Child elements now maintain their dimensions correctly

### Changed

- **Icon Loading Strategy**: Changed from loading a limited set of "common icons" to loading all icons lazily. Users can now scroll through the entire icon set or use search to filter, with no artificial limits.

- **Default Settings**: "Use Last Color" feature is now enabled by default for new fields to improve workflow efficiency.

### Technical Improvements

- **Code Quality**:
  - Removed all debug logging statements
  - Improved error handling for missing/malformed manifest files
  - Better handling of ACF field lifecycle events
  - Optimized React component rendering and state management

- **Context Detection**: Implemented robust field context detection to identify:
  - Field group key
  - Flexible content layout name
  - Repeater field key

  This enables context-aware features like "Use Last Color" to work correctly across different field structures.

---

## [0.1.0] - Initial Release

Initial release of ACF Open Icons plugin.

