# Changelog

## [0.3.0] - 2024

### Added

#### Features

- **Icon Migration Tool**: Complete icon migration system for switching between icon providers (e.g., Heroicons to Lucide, Tabler Icons, etc.).

  - **Automatic Migration**: When changing the active icon provider in settings, icons with matching names are automatically migrated to the new provider
  - **Manual Migration**: Icons without exact name matches appear in a migration tool where users can manually select replacement icons
  - **Migration Status**: Real-time status showing which icons need migration, grouped by provider and icon key
  - **Bulk Operations**: "Migrate All" button to migrate multiple selected icons at once with a single summary notification
  - **Visual Preview**: Side-by-side preview of old and new icons in the migration tool
  - **Smart Detection**: Finds icons across all WordPress meta types (post_meta, options, usermeta, termmeta) and excludes post revisions
  - **Color Preservation**: Migrated icons preserve their original color tokens and apply the correct color to the new icon

- **Automatic Color Token Updates**: When color tokens are changed in settings, all stored icons using those tokens are automatically updated with the new color values. This ensures consistency between stored icons and current color settings.

- **Fill/Stroke Detection**: Intelligent color application that detects whether icons use `fill` or `stroke` attributes (or both), ensuring consistent color rendering across different icon set structures (e.g., Heroicons solid uses fill, while outline versions use stroke).

  - Applied consistently in both backend (PHP) and frontend (React) code
  - Uses negative lookahead regex to avoid incorrectly matching attributes like `stroke-width`, `fill-opacity`, etc.
  - Handles edge cases like `fill="none"` correctly

- **Loading State Indicators**: Added loading spinner when icon SVG is being fetched, providing immediate visual feedback that an icon selection is in progress.

#### UX Improvements

- **"Use Last Color" as Default**: Changed "Use Last Color" behavior from forced to default. The last used color is now suggested as the default when opening the picker, but users can freely change it. This allows flexibility when working with multiple colors in the same repeater field.

- **Provider-Aware Icon Picker**: Icon picker now always displays icons from the current active provider, regardless of which provider was used for existing icons. This ensures users see the correct icon set when selecting new icons.

- **Improved Modal Performance**: Implemented `flushSync` for faster modal closing, providing immediate visual feedback when selecting icons.

### Fixed

- **Icon Preview on Selection**: Fixed issue where icons in loading state weren't showing in the preview. Icons now display a loading spinner immediately, then update to show the actual icon once the SVG is loaded.

- **Color Application Consistency**: Fixed inconsistencies between backend and frontend color application. Both now use the same logic for detecting and applying colors to fill/stroke attributes.

- **Provider Display**: Fixed issue where icon picker modal would show incorrect library name (e.g., showing "Lucide" when using Tabler Icons). Modal now correctly displays the active provider name.

- **Migration Tool Visibility**: Fixed migration tool not appearing after changing provider settings. Tool now correctly detects and displays when icons need migration.

- **Post Revision Exclusion**: Fixed migration tool finding icons stored in post revisions. Now only searches the latest versions of posts.

- **Color Token Respect**: Fixed migrated icons not respecting their original color tokens. Migrated icons now correctly apply the stored color token to the new icon.

### Changed

- **"Use Last Color" Behavior**: Changed from forcing the last color to using it as a default that can be overridden. Users can now select different colors for different icons in the same repeater field while still benefiting from the convenience of the default.

- **Migration Tool UI**: Improved styling and layout of the migration tool to match other sections of the settings page for consistency.

- **Toast Notifications**: Changed from individual toasts per icon to a single summary toast when using "Migrate All" functionality.

### Technical Improvements

- **REST API Endpoints**: Added `/migration/status` and `/migration/migrate-icon` endpoints for migration functionality.

- **Color Application Logic**: Unified color application logic across PHP and TypeScript, ensuring consistent behavior between backend storage and frontend display.

- **SVG Attribute Parsing**: Improved regex patterns for SVG attribute manipulation with negative lookahead/lookbehind to prevent incorrect matches.

- **State Management**: Improved React state management for migration tool, preventing cross-contamination between different icon groups.

---

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
