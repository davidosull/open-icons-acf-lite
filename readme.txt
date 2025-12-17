=== ACF Open Icons - Lite ===
Contributors: davidosull
Tags: acf, icons, heroicons, advanced custom fields, icon picker, svg
Requires at least: 6.0
Tested up to: 6.7
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A beautiful icon picker field for Advanced Custom Fields, featuring 300+ Heroicons with colour palette support and SVG caching.

== Description ==

**ACF Open Icons - Lite** adds a powerful icon picker field to Advanced Custom Fields. Choose from 300+ beautifully crafted Heroicons and apply custom colours using a simple palette system.

= Features =

* **300+ Heroicons** - Access the complete Heroicons outline set by Tailwind Labs
* **Colour Palette** - Define up to 3 brand colours and apply them to any icon
* **SVG Caching** - Icons are cached locally for fast loading
* **Clean Output** - Sanitised SVG output safe for your templates
* **Easy to Use** - Simple, intuitive icon picker modal

= How It Works =

1. Create an ACF field group with an "Open Icons" field
2. Select icons from the picker modal
3. Apply colours from your defined palette
4. Output icons in your theme using the helper function

= Template Usage =

Display an icon in your theme:

`<?php
$icon = get_field('my_icon_field');
if ($icon) {
    acf_open_icon($icon, ['size' => 24]);
}
?>`

= Want More Icons? =

Upgrade to [ACF Open Icons Pro](https://acfopenicons.com) for:

* 15,000+ icons from Lucide, Tabler, and Heroicons
* Icon library migration tools
* Priority support
* Automatic updates

== Installation ==

= Automatic Installation =

1. Go to Plugins > Add New in your WordPress admin
2. Search for "ACF Open Icons"
3. Click "Install Now" then "Activate"

= Manual Installation =

1. Download the plugin zip file
2. Go to Plugins > Add New > Upload Plugin
3. Upload the zip file and click "Install Now"
4. Activate the plugin

= Requirements =

* WordPress 6.0 or higher
* PHP 7.4 or higher
* Advanced Custom Fields 6.0 or higher (free or Pro)

== Frequently Asked Questions ==

= Does this work with ACF Free? =

Yes! ACF Open Icons - Lite works with both the free version of ACF and ACF Pro.

= How do I output icons in my theme? =

Use the `acf_open_icon()` helper function:

`<?php acf_open_icon($icon, ['size' => 32, 'class' => 'my-icon']); ?>`

= Can I change the icon colour? =

Yes! You can define up to 3 palette colours in the plugin settings. Each icon can use any colour from your palette. You can also override colours in templates:

`<?php acf_open_icon($icon, ['color' => '#ff0000']); ?>`

= Where are the icons stored? =

Icons are fetched from CDN on first use and cached locally in your uploads folder for fast subsequent loads.

= How do I clear the icon cache? =

Go to ACF > Open Icons in your WordPress admin and click "Purge Icon Cache".

= What's the difference between Lite and Pro? =

**Lite (Free):**
* 300+ Heroicons
* Colour palette support
* SVG caching

**Pro ($5/month or $40/year):**
* 15,000+ icons (Lucide, Tabler, Heroicons)
* Icon library migration tools
* Switch between icon libraries easily
* Priority support

== Screenshots ==

1. The icon picker modal showing available Heroicons
2. Plugin settings page with colour palette configuration
3. An ACF field with a selected icon

== Changelog ==

= 1.0.0 =
* Initial release
* 300+ Heroicons included
* Colour palette support with 3 customisable tokens
* SVG caching for performance
* Clean, sanitised SVG output
* Helper function for theme templates

== Upgrade Notice ==

= 1.0.0 =
Initial release of ACF Open Icons - Lite.
